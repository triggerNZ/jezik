#!/usr/bin/env node
// Reads the latest Supabase magic-link from the local Supabase mail service
// (Mailpit, served on :54324, despite supabase calling it "inbucket") and
// prints the verify URL to stdout. Used by Playwright-driven sign-in flows.
//
// Usage:
//   node scripts/dev-magic-link.mjs <email> [--timeout=15000] [--keep]

const MAIL = 'http://127.0.0.1:54324';

const args = process.argv.slice(2);
let email;
let timeoutMs = 15000;
let keep = false;

for (const arg of args) {
  if (arg.startsWith('--timeout=')) timeoutMs = Number(arg.slice('--timeout='.length));
  else if (arg === '--keep') keep = true;
  else if (!email && !arg.startsWith('--')) email = arg;
}

if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/dev-magic-link.mjs <email> [--timeout=ms] [--keep]');
  process.exit(2);
}

const VERIFY_RE = /https?:\/\/[^\s"'<>)\]]*\/auth\/v1\/verify\?[^\s"'<>)\]]+/;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function findLatestMessageId() {
  // Mailpit search API: query like `to:"foo@bar"` returns newest first.
  const url = `${MAIL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}&limit=1`;
  const data = await getJson(url);
  return data.messages?.[0]?.ID ?? null;
}

function extractLink(message) {
  const html = (message.HTML ?? '').replace(/&amp;/g, '&');
  const text = message.Text ?? '';
  return html.match(VERIFY_RE)?.[0] ?? text.match(VERIFY_RE)?.[0] ?? null;
}

const deadline = Date.now() + timeoutMs;
let lastErr;

while (Date.now() < deadline) {
  try {
    const id = await findLatestMessageId();
    if (id) {
      const full = await getJson(`${MAIL}/api/v1/message/${id}`);
      const link = extractLink(full);
      if (link) {
        if (!keep) {
          await fetch(`${MAIL}/api/v1/messages`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ IDs: [id] }),
          }).catch(() => {});
        }
        console.log(link);
        process.exit(0);
      }
    }
  } catch (err) {
    lastErr = err;
    if (err.cause?.code === 'ECONNREFUSED') {
      console.error(`Mail service unreachable at ${MAIL}. Is local Supabase running? (\`supabase start\`)`);
      process.exit(1);
    }
  }
  await new Promise((r) => setTimeout(r, 250));
}

console.error(`No magic link for ${email} within ${timeoutMs}ms${lastErr ? ` (last error: ${lastErr.message})` : ''}`);
process.exit(1);
