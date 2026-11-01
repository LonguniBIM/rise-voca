# Weather Report review and Toy Factory lessons

Content version: `2026.11.01.1`. Baseline: `90827613fbf8c84e62bd13dfa4e23bb331ddb1b8`.
Canonical pack: `data/lesson-packs/2026-11-01-weather-toy-factory.json`.

## Supplied lesson inventory

| Date | Source class | Theme / Lesson | Title | Core | Key | Total |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 17/10/2026 | PK1_2603 | 4 - Weather Report / 10 | I Feel | 13 | 8 | 21 |
| 18/10/2026 | PK1_2603 | 4 - Weather Report / 11 | I Am the Weather Reporter | 13 | 10 | 23 |
| 24/10/2026 | PK1_2603 | 4 - Weather Report / 12 | Exploration: I Feel - I Am the Weather Reporter | 13 | 10 | 23 |
| 31/10/2026 | PK2_2603 | 5 - Toy Factory / 1 | Head, Shoulders and Neck | 3 | 6 | 9 |
| 01/11/2026 | PK2_2603 | 5 - Toy Factory / 2 | Arms, Hands and Fingers | 3 | 10 | 13 |

The Weather Report song is Weather Song; the Toy Factory song is Hokey Pokey.
The build adds Monday-Sunday weeks 12-18 October, 19-25 October and 26 October-1 November.
The existing newest-first weekly display puts the Toy Factory week first.

## Vocabulary coverage

All three Weather Report lessons include Hot, Warm, Cool, Cold, Spring, Summer,
Autumn, Winter, Sunny, Windy, Cloudy, Rainy and Snowy as Core Words. Lesson 10 has
House, Tree, Fly, Sprout, Turning green, Bloom, Leaves and Falling down as Key Words.
Lessons 11 and 12 also include Umbrella and Wet. These 23 unique items already exist
and retain their stable IDs and definitions. Turning green and Bloom remain separate.

Toy Factory Lesson 1 includes Head, Shoulders and Neck as Core Words, followed by
Robot, Toy factory, Dog, Bird, Jump and Cat as Key Words. Lesson 2 includes Arms,
Hands and Fingers as Core Words, followed by Robot, Toy factory, Magnifier, Walk,
Pond, Frog, Stretch, Clap, Wiggle and Touch as Key Words. Dog and Bird reuse their
existing animal senses; the other 18 items are new. Fingers is distinct from the
existing numeric One finger target. Nod and Shrug appear only in source speaking
questions and are not added to the vocabulary target list.

The five lessons contain 89 target memberships and 43 distinct vocabulary entries.
Every full session includes every assigned Core and Key Word, even if the same word
has already been solved in another lesson or class. Quick review may deduplicate
shared words; it never completes the corresponding daily lessons.

## Class identity and preservation

Toy Factory uses source class PK2_2603, display class PK2 and new IDs
`pk2-2603-t5-l1` / `pk2-2603-t5-l2`. The publishing validator now derives the class
prefix from each source class and checks both displayClass and the lesson name.
It accepts PK2 without relabeling earlier PK1 lessons.
The page description includes both classes, and the shared age badge no longer
labels the whole app as PK1. Each lesson still displays its own source class.

The historical library identity `rise-voca-pk1` remains unchanged because sessions
and backups depend on it. No storage migration or reset is needed. All 45 earlier
lessons, 239 question definitions, old source records and illustration recipes stay
unchanged. Shared items acquire source memberships and topic memberships only.
All new question tuples explicitly use the Toy Factory topic, including Robot and
Toy factory, which belong to both new lessons.

## Source handling and speaking reference

The pack records the original filename and SHA-256 for each supplied sheet. Scans,
full stories and learner information are not added to the repository. New quiz clues,
hints, Vietnamese meanings and answer choices are authored for the app and are not
presented as quotations from the sheets.

Weather Lessons 10 and 11 retain their two visible questions; Lesson 12 has four.
Run-together questions and punctuation spacing are normalized without borrowing
questions from another day. Toy Factory retains the printed patterns
"They are my shoulders." and "Clap the hands". All speaking patterns remain
parent-led, unscored references.

The first Toy Factory reading paragraph has cropped edge text. Its visible story is
summarized and a non-blocking reading note records the crop. The vocabulary table is
fully readable, so this does not block a full vocabulary session. The second reading
reference summarizes the robot's two arms, two hands and ten fingers.

## Illustrations

Eight new Unicode cues start as `needs-review`: Robot, Toy factory, Cat, Hands,
Magnifier, Walk, Frog and Clap. They are not automatically approved. Head, Shoulders,
Neck, Jump, Arms, Fingers, Pond, Stretch, Wiggle and Touch have no exact attached
illustration and remain answerable through the authored clue, Hint and Listen.
No external art or font files are added. Parent approval/rejection remains local
and does not create learning evidence.

## Release verification contract

| Measure | Before | After |
| --- | ---: | ---: |
| Full lessons | 45 | 50 |
| Weekly packs | 23 | 26 |
| Topics | 4 | 5 |
| Ready items | 239 | 257 |
| Lesson memberships | 912 | 1,001 |
| Archived items | 8 | 8 |

`tests/new-units.test.mjs` exercises the publishing validator with a PK2 fixture,
exact source-based session coverage, cross-class reuse, independent completion,
preserved prior content and backup compatibility. Existing historical tests retain
their original release boundaries and counts.

Run `npm run validate`, `npm test`, `npm run build`, `node scripts/build.mjs --check`
and `node scripts/check-pages.mjs`, followed by both `tests/browser.py` and
`tests/auto_browser.py` against real disposable browser origins. Check all five new
lesson cards and their four-choice questions at phone/tablet sizes and offline.
The Pages workflow must validate and deploy only generated `dist`, then verify live
runtime bytes. These expected totals do not themselves claim deployment success.

To update an installed app, Save & pause, close all Rise_Voca windows and reopen.
Do not clear site data. Physical-device installation and audible offline speech
remain separate from automated browser checks.
