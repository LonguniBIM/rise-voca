# Toy Factory: lessons on 14 and 15 November 2026

Content version: `2026.11.15.1`. Baseline: `a31f54ffb8a98c862ef9e59e40b9d94e15f22f5c`.
Canonical lesson pack: `data/lesson-packs/2026-11-15-toy-factory.json`.

## Source inventory

| Date | Source class | Lesson | Title | Core | Key | Total |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| 14/11/2026 | PK2_2606 | 5 | Foot/Feet, Walk, Jump and Run | 5 | 4 | 9 |
| 15/11/2026 | PK2_2606 | 6 | Exploration: Head, Shoulders, Neck, Arms, Hands, Fingers, Foot/Feet, Walk, Jump and Run | 11 | 8 | 19 |

Both sheets specify Theme 5 - Toy Factory, song Hokey Pokey and home reading Toy Factory. The new Monday-Sunday week is **9-15 November 2026**. Existing newest-first ordering puts it above the November 2-8 week.

| Source file | SHA-256 |
| --- | --- |
| `2aOboRCLVooAaE6tEqwl4F9lMHkOO1DpuVUmb6XI.jpg` | `77087b83da7cdaa4c9914bdd39dfbe66e68f02948d373803a4ce18ec695c9345` |
| `2aOboRCLVovLkaQGLqtiXvV4T7qQcB8erh3YjjJQ.jpg` | `0074fc17536964cebb2f405f24fe2208ac5cedfc3e250bcd6bebc2a2a9908e69` |

Original scans are not published.

## Exact coverage and vocabulary distinctions

Lesson 5 Core Words: **Foot, Feet, Walk, Jump, Run**. Key Words: **Robot, One foot, Two feet, Body parts**.

Lesson 6 Core Words: **Head, Shoulders, Neck, Arms, Hands, Fingers, Foot, Feet, Walk, Jump, Run**. Key Words: **Robot, Toy factory, Balloon, Boy, Girl, One foot, Two feet, Body parts**.

Five distinct items are added: `foot`, `feet`, `one-foot`, `two-feet` and `body-parts`. Fourteen other words reuse existing definitions, including `run`; Run retains its original authored Weather topic and receives the selected Toy Factory topic in new session snapshots.

Foot and Feet are separate singular/plural naming targets. One foot and Two feet are separate quantity phrases. Questions never offer Foot alongside One foot, or Feet alongside Two feet, as competing answers to the same ambiguous naming clue. All nine Lesson 5 targets also occur in Lesson 6; neither lesson can be completed by the other's results.

## Source wording

The full source class remains `PK2_2606`, separate from older `PK2_2603` records. Lesson IDs are `pk2-2606-t5-l5` and `pk2-2606-t5-l6`; display names are `PK2_5 - Toy Factory_5` and `PK2_5 - Toy Factory_6`.

The Lesson 6 display title adds a colon after Exploration and a comma after Fingers. The original printed title is retained in `source.printedTitle`. Speaking text preserves `These/They`, `head/hands`, both occurrences of `Yes, I can.` in Lesson 6, and `(J-U-M-P)`. Ellipses, whitespace and terminal punctuation are normalized. Spelling is unscored parent-led practice; it does not add alphabet targets or a speech assessment.

Lesson 5 home reading describes finding the robot's two feet so it can walk, jump and run. Lesson 6 asks the parent and child to reread the opening chapters and review body parts and movement. The app carries short English summaries, not full stories.

## Illustrations and history

Foot and One foot use a single native foot cue; Feet and Two feet use two. Body parts has a reviewable group of three licensed images showing a head, arms and feet. The accompanying illustration pack also fills missing pictures in earlier lessons; see `ILLUSTRATION_LIBRARIES.md`.

All 52 previous lessons, source records, 257 older question definitions, archived items and existing non-missing illustration recipes are preserved. Saved sessions retain their exact question and illustration snapshots. A paused older lesson is not rewritten to use newly added pictures. Existing emoji/CSS approval keys, storage identities, database version, scoring and voice preferences are unchanged.

Expected release counts: **54 full lessons, 28 weeks, five themes, 262 active ready items, 1,060 lesson memberships and eight archived items**.

## Verification and release

Run source validation, all Node tests, deterministic build and publishing checks. Run `tests/browser.py`, `tests/auto_browser.py` and `tests/illustrations_browser.py` against real origins. The new suite covers both lessons, all SVG previews, image review, phone/tablet layout, offline reopen, decode failure and failed cache integrity. It uses synthetic voices, not an audible device assessment.

Publish validated `dist` through the existing Pages workflow. Check the workflow and exact deployed bytes before claiming publication. Update an installed app by saving and pausing, closing all app windows and reopening; never clear site data.
