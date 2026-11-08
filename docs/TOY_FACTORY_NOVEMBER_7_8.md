# Toy Factory: lessons on 7 and 8 November 2026

Content version: `2026.11.08.1`. Baseline commit: `8721b728f650c6884513171dcba7b54bceb80457`.
Canonical pack: `data/lesson-packs/2026-11-08-toy-factory.json`.

## Source inventory

| Date | Source class | Lesson | Title | Core | Key | Total |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| 07/11/2026 | PK2_2606 | 3 | Exploration: Head, Shoulders, Neck, Arms, Hands and Fingers | 6 | 14 | 20 |
| 08/11/2026 | PK2_2606 | 4 | Head, Shoulders, Neck, Arms, Hands and Fingers | 6 | 5 | 11 |

Both sheets specify Theme 5 - Toy Factory, song Hokey Pokey and home reading
Toy Factory. The new Monday-Sunday week is 2-8 November and appears first in
the existing newest-first weekly display.

## Exact target coverage

Both lessons include Head, Shoulders, Neck, Arms, Hands and Fingers as Core Words.

Lesson 3 Key Words, in printed column order: Robot, Toy factory, Dog, Bird, Jump,
Cat, Magnifier, Walk, Pond, Frog, Stretch, Clap, Wiggle and Touch.

Lesson 4 Key Words: Robot, Toy factory, Balloon, Boy and Girl. Balloon remains the
singular target. Nod and Shrug occur only in speaking questions and are not added
to the vocabulary list.

All 23 distinct words across these sheets already exist. The pack adds 31
item-to-lesson memberships without duplicating word definitions or adding
illustrations. Each full session includes all of its 20 or 11 targets. Prior
success with shared words never completes another daily lesson.

## Class and source fidelity

The new sheets explicitly print **PK2_2606**. Their IDs are `pk2-2606-t5-l3` and
`pk2-2606-t5-l4`; display names remain `PK2_5 - Toy Factory_3` and
`PK2_5 - Toy Factory_4`. Earlier PK2_2603 sheets retain their original class,
dates, IDs, target lists and speaking notes. The new class does not authorize
renaming or merging those earlier records.

The pack records the original filenames and SHA-256 values of both supplied
images. Vocabulary is transcribed directly from each sheet. Source questions
and answer patterns retain their wording, including "Clap the hands",
"These/They" and singular "head" in the Lesson 4 question. Small ellipsis
sequences, spacing, line breaks and terminal punctuation are normalized.
Incomplete prompts remain unfilled, and speaking remains parent-led and unscored.

Lesson 3 home reading asks the parent and child to reread the first two chapters
and review upper-body parts. Lesson 4 describes reattaching the robot's upper
body and looking for its lower-body parts. Reading instructions are summarized
in English; no full story or source scans are published.

## Verification and update

Expected release totals: **52 full lessons, 27 weeks, five topics, 257 ready
items, 1,032 lesson memberships and eight archived items**. All 50 earlier
lesson records, question definitions, illustration recipes and existing
learner-storage identities are preserved. Shared items gain source references
and, where needed, the Toy Factory topic membership.

The authored tuples for Boy and Girl explicitly retain their previously published
`colors` question topic. Without this metadata, adding a second source would make
the loader fall back to `abc`. This two-field fix leaves all five earlier composed
catalog/illustration payloads identical. Toy Factory session snapshots still use
their selected lesson's topic. `tests/catalog-topic-preservation.test.mjs` covers
this regression without changing the loader or historical question content.

Run the existing validation and test suite, deterministic build check and
publishing-directory gate. Verify both new sessions against the supplied core
and key lists and compare old content against the baseline. Run both required
real-origin browser suites, then check the new lesson cards, four choices,
PK2_2606 source class, independent progress and offline reopening.

Publish only validated `dist` through the existing Pages workflow and verify
the deployed version separately. To update an installed app, Save & pause,
close all Rise_Voca windows and reopen. Do not clear site data.
