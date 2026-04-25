---
name: drive-ui
description: Drive the jezik web UI through Playwright — sign in past the magic-link wall, navigate the app, capture screenshots. Use whenever you need to verify UI behavior, reproduce a bug, or capture before/after screenshots of the running app.
allowed-tools: Bash(playwright-cli:*) Bash(npm:*) Bash(node:*) Bash(curl:*) Bash(supabase:*) Bash(lsof:*)
---

# Drive the jezik UI through Playwright

This skill exists because the app uses Supabase magic-link auth (`signInWithOtp` in `lib/auth.tsx`). A human normally clicks the link in their email — Claude can't. We work around it by reading the email out of the local Supabase mail catcher (**Mailpit**, served on :54324 even though `supabase/config.toml` still calls the section `[inbucket]`) via a helper script, then navigating to the verify URL with Playwright.

For low-level Playwright commands, defer to the `playwright-cli` skill. This skill layers the jezik-specific recipe on top.

## Prereqs (verify, don't assume)

Four things must be true. Check each; fix what's missing.

```bash
# 1. Local Supabase running (gives you :54321 API + :54324 Mailpit)
npx supabase status     # if not running: npx supabase start

# 2. Mail catcher (Mailpit) reachable
curl -fsS http://127.0.0.1:54324/api/v1/info >/dev/null && echo mail-ok

# 3. App env points at LOCAL Supabase, not the hosted project.
#    The committed .env points at hosted; we override with .env.local (gitignored).
cat /Users/tin/jezik/.env.local 2>/dev/null
# Expected:
#   EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key from `npx supabase status -o env`>
# If missing, write it (and restart the dev server — Metro caches env at startup).

# 4. Expo web dev server on :8081
lsof -i :8081           # if empty: npm run web   (background; wait for /sign-in to 200)
```

If you change `.env.local` while the dev server is running, **kill and restart `npm run web`** — Metro caches env vars at boot.

The committed `supabase/config.toml` already has `site_url = "http://localhost:8081"` and `additional_redirect_urls = ["http://localhost:8081", "http://127.0.0.1:8081"]`. If those drift back to `:3000`, the magic link will redirect to a dead port and Playwright will see `ERR_CONNECTION_REFUSED`. Restart Supabase after editing config (`npx supabase stop && npx supabase start`).

## Test identity

Always sign in as **`claude+pw@local.test`** unless told otherwise. The `claude+pw` local-part is stable and won't collide with the user's own dev account.

Pre-clear matching messages so the helper doesn't pick up a stale link:

```bash
curl -s "http://127.0.0.1:54324/api/v1/search?query=$(printf %s 'to:"claude+pw@local.test"' | jq -sRr @uri)" \
  | jq -r '.messages[].ID' \
  | xargs -I{} curl -s -X DELETE -H 'Content-Type: application/json' \
      --data '{"IDs":["{}"]}' http://127.0.0.1:54324/api/v1/messages >/dev/null
# or just nuke everything: curl -X DELETE http://127.0.0.1:54324/api/v1/messages
```

## Sign-in recipe

```bash
# 1. Open the sign-in screen
playwright-cli open http://localhost:8081/sign-in

# 2. Snapshot to find the email input + button refs
playwright-cli snapshot

# 3. Fill the email (input has placeholder "you@example.com") and submit.
#    --submit presses Enter; the button is labelled "Send magic link".
playwright-cli fill <email-input-ref> "claude+pw@local.test"
playwright-cli click <send-button-ref>

# 4. Wait for the "Check your email." confirmation
playwright-cli snapshot   # confirm copy "Check your email." is visible

# 5. Pull the magic link from Inbucket (helper polls up to 15s)
LINK=$(npm run --silent magic-link -- claude+pw@local.test)
# or: LINK=$(node scripts/dev-magic-link.mjs claude+pw@local.test)

# 6. Visit it. Supabase verify endpoint 302s back to localhost:8081 with the
#    session in the URL fragment, which detectSessionInUrl picks up.
playwright-cli goto "$LINK"
playwright-cli snapshot   # confirm authenticated home screen
```

If step 5 prints `No magic link for ...` the email never arrived — see Debugging.

## Reusing sessions across runs

After a successful sign-in, snapshot the auth state so subsequent runs skip the email dance until the token expires:

```bash
playwright-cli state-save .playwright-cli/auth-claude-pw.json
```

To resume:

```bash
playwright-cli open --config=.playwright-cli/auth-claude-pw.json http://localhost:8081/
# or via state-load on an open session — see playwright-cli skill
```

If the resumed session lands on `/sign-in`, the token expired — re-run the sign-in recipe and overwrite the state file.

## Screenshots & artifacts

The `.playwright-cli/` directory is the convention here (existing screenshots live there). Name files `<feature>-<step>.png`, e.g. `lesson3-1-initial.png`, `lesson3-2-correct.png`. The CLI writes there by default; pass `--filename=.playwright-cli/<name>.png` to override.

## Debugging checklist

**Helper times out (`No magic link for ...`)**
- Confirm `signInWithOtp` actually fired: open `playwright-cli console` and look for Supabase requests, or check `playwright-cli network`.
- Confirm Mailpit is up and seeing mail: `curl -s 'http://127.0.0.1:54324/api/v1/messages?limit=5' | jq '.total, .messages[].To'`.
- Supabase rate-limits OTP per email — if you've spammed the same address, wait a minute or use `claude+pw2@local.test`.
- Check the email actually contains a `/auth/v1/verify?...` URL: grab the latest message id and inspect: `curl -s http://127.0.0.1:54324/api/v1/message/<ID> | jq '.HTML, .Text'`.

**Helper exits with `Mail service unreachable`**
- Local Supabase isn't running. `supabase start`.

**Visiting the link doesn't authenticate (still on `/sign-in`)**
- Confirm `lib/supabase.ts` still has `detectSessionInUrl: Platform.OS === 'web'`. If a recent change disabled it, web won't parse the fragment.
- Confirm `emailRedirectTo` in `lib/auth.tsx` resolves to `http://localhost:8081`. The link's `redirect_to=` query param must match an entry in `supabase/config.toml`'s `additional_redirect_urls`, otherwise Supabase silently falls back to `site_url`.
- Open the link in a real browser to bisect: if it works there but not via Playwright, the playwright-cli context may be blocking storage — check `state-save` output.

**`Email address "..." is invalid`**
- You're talking to **hosted** Supabase, not local. Hosted rejects `.test` and `example.com` test domains. Add `.env.local` pointing at `http://127.0.0.1:54321` and restart the dev server.

**Dev server isn't on :8081**
- Expo sometimes shifts ports if 8081 is taken. `lsof -i :8081`; if empty, look for `:8082` etc. and update the URLs.
