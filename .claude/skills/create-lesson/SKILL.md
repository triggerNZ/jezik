---
name: create-lesson
description: Author a new jezik topic/lesson that pairs a vocabulary area with a related grammar concept. Use when the user asks for a new lesson, topic, or content drop.
---

# Create a jezik lesson

Every lesson in jezik must pair a **vocabulary area** with a **grammar concept** that naturally surfaces in that vocab. Pure-vocab lessons are out. The vocab gives the learner words; the grammar gives them productive sentences from day one.

## Design step (do this first, before writing any code)

Name both axes explicitly and confirm with the user before authoring:

- **Vocab area** — concrete domain (food, family, weather, transport...). 8–12 words is plenty for one lesson.
- **Grammar thread** — a single, focused concept that the vocab can carry. Keep it to one. Examples for English → Croatian:
  - `biti` / `imati` present-tense conjugation
  - present-tense conjugation of a regular verb pattern
  - one noun case (nominative, accusative, genitive, dative-locative, instrumental)
  - gender agreement of adjectives
  - possessives

If you can't write 2–3 short sentences in the target language using *only* this lesson's vocab + grammar, the pairing is wrong — pick a tighter grammar thread.

Pick the lesson **title** to name the activity, not the grammar (e.g. "Eating & drinking", not "Accusative case"). Grammar belongs in the exercises.

## File layout

Each topic gets its own file in `data/topics/<slug>.ts`, exporting:

```ts
export const topic: Topic = { ... };
export const exercises: Exercise[] = [ ... ];
```

Then register it in `data/seed.ts` by importing and appending to the `topics` and `exercises` arrays. Pick the next free `order` number.

ID conventions:
- Topic id: `<slug>-1` (e.g. `eating-drinking-1`). The trailing `-1` leaves room for `<slug>-2` follow-ons later.
- Exercise ids: a short topic-specific prefix, e.g. `eat-1`, `eat-2`. Don't reuse a prefix from another topic. Once shipped, **never rename an exercise id** — `UserProgress.exercises` in Supabase is keyed by it.

## Exercise types (defined in `types/models.ts`)

Use the existing union; do not invent new types. Mix all three across the lesson:

- **`multiple_choice`** — one prompt, one `correctAnswer`, 3 distractors. Single correct answer only — handle ambiguity at authoring time. Good for vocab recall and isolated grammar forms (e.g. "I am eating" → `jedem`, distractors `jedeš`/`jede`/`jedemo`).
- **`match_pairs`** — 4 source/target pairs. Pure vocab; doesn't exercise grammar. Use ~1 per lesson.
- **`tile_translation`** — prompt sentence, one or more `correctAnswers` (each a tile sequence), plus `distractorTiles`. This is the workhorse for grammar — force the learner to pick the correct conjugation/case from a pool that contains plausible wrong forms.

## Lesson recipe

Aim for **6–8 exercises** total, roughly:

1. 2× `multiple_choice` — vocab recall (one in each direction: target→source and source→target).
2. 1× `match_pairs` — vocab consolidation.
3. 1× `multiple_choice` — isolated grammar form (e.g. pick the correct conjugation).
4. 3× `tile_translation` — full sentences combining vocab + grammar. Vary subject pronouns (1sg, 3sg, 1pl) so multiple conjugation forms get exercised. Make at least one distractor per tile-translation a wrong-case or wrong-conjugation form of a real answer tile, not unrelated noise.

Authoring rules for tile-translation:
- Croatian drops subject pronouns freely. Always include both with-pronoun and pro-drop orderings in `correctAnswers` when both are natural (see `ex-5` in `data/topics/greetings.ts` for the precedent).
- The tile pool is derived: max occurrences of each tile across any single answer + `distractorTiles`, deduplicated case-insensitively. So if "Ja" appears in one answer and not another, the learner still sees one "Ja" tile.
- Capitalisation matters for display but not matching — first tile in any sentence should be capitalised in `correctAnswers`.

## Verify

After writing the files, run both — they should pass cleanly:

```bash
npx tsc --noEmit
npm run lint
```

Then ask the user to walk the lesson in `npx expo start`:
- Lesson appears on the home screen at the expected `order`.
- Each exercise renders and accepts the correct answer; each distractor is rejected.
- For tile-translation with multiple `correctAnswers`, both pro-drop and with-pronoun orderings are accepted.

You cannot drive the UI from the terminal — say so explicitly rather than claiming the lesson works end-to-end.

## Out of scope

Don't touch types, renderers, `composeSession`, progress tracking, or auth when adding a lesson. If the lesson seems to need a new exercise type, stop and discuss with the user — that's a separate piece of work.
