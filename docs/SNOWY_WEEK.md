# Weather Report: lessons on 10 and 11 October 2026

Content version: `2026.10.14.1`. Baseline commit: `126a2b3bad30b0fa59fc4b4f293025ffca55b0d7`.
Canonical pack: `data/lesson-packs/2026-10-14-snowy-week.json`.

## Source-led lesson inventory

| Date | Name | Core Words | Key Words | Full-session targets |
| --- | --- | --- | --- | ---: |
| 10/10/2026 | PK1_4 - Weather Report_8 | Snowy | Warm, Melt, Snowflake, Snowman, Ski, Snowball | 7 |
| 11/10/2026 | PK1_4 - Weather Report_9 | Cloudy windy day, Rainy windy day, Snowy | Umbrella, Wet, Dark, Play, Boat, Warm, Melt, Snowflake, Snowman, Ski, Snowball | 14 |

Class: PK1_2603. Theme: 4 - Weather Report. Song: Weather Song.
The build groups both dates into Monday-Sunday week **05/10/2026-11/10/2026**.
The existing newest-first home order places this week first.

The first title is Snowy Day. The second title is Exploration: Rainy Windy Day and Cloudy Windy Day - Snowy Day.
The title order is preserved separately from the printed Core Words column order.

## Add-only and preservation boundaries

Only two new lesson IDs and six new item IDs are added. Snowy is an adjective target, not a replacement for the existing noun Snow. Warm and the other existing vocabulary records retain their IDs, clues, meanings and illustrations; they acquire additional source memberships only. Completing Lesson 8 never completes Lesson 9. Both lessons include all required targets, even when repeated elsewhere.

Both source images have distinct SHA-256 values and are different from the previous 43 sources. The original filenames and hashes are stored in the canonical pack. Source scans and full story text are not published. App-authored clues, hints, meanings and distractors are not represented as source quotations. The authored Ski question uses the snow activity; the sheet itself supplies the word without a part-of-speech label.

No quiz, speech, scoring, storage, service-worker implementation, workflow permissions or old content packs are changed. Existing pending-era IDs, archived source records, corrections and historical session snapshots remain intact. The new content changes the deterministic build/cache fingerprint automatically.

## Source speaking notes, not vocabulary blockers

Both new sheets still use **sunny/windy** in their Key Questions and Key Sentences. Preserve these patterns as unscored reference and display the mismatch in each lesson's source notes. Do not silently replace them with snowy/cloudy/rainy, and do not extend the earlier parent correction for Lesson 5 to these new sheets. The vocabulary lists themselves are fully readable, so this note does not block full vocabulary sessions. `sourceWarnings` retains the scope and the fact that these are non-blocking notes.

## Illustrations

Five new Unicode emoji/composite cues start as **needs-review**: Snowy, Melt, Snowflake, Snowman and Ski. The existing original CSS frames and animation are reused. They are not automatically parent-approved. Snowball has no exact attached illustration in this pack; it remains answerable using its spoken/written clue. Do not substitute the snowflake icon or another unrelated object merely to fill this mapping. No external artwork, source scans or font files are added.

## Release checks and expected counts

| Measure | Before | After |
| --- | ---: | ---: |
| Lessons / full lessons | 43 / 43 | 45 / 45 |
| Weekly packs | 22 | 23 |
| Active ready items | 233 | 239 |
| Item-to-lesson memberships | 891 | 912 |
| Weather Report lessons | 7 | 9 |
| Archived items | 8 | 8 |
| New illustration review candidates in this update | 0 | 5 |

`tests/confirmed-catalog.test.mjs` retains all prior assertions at the parent-confirmation release boundary. `tests/snowy-week.test.mjs` tests this additive release against that exact baseline, source hashes, target order, old definitions/illustrations, independent completion, backups, source notes and duplicate prevention. All current lessons must have complete question coverage. The existing real-origin browser suites continue to test persistence, offline behavior, speech settings and phone/tablet layouts.

Expected counts are a release contract, not evidence that a workflow ran. Check the actual pull request and main deployment runs. Updates use Save & pause and closing/reopening Rise_Voca; never clear IndexedDB or site data. Physical iPad/iPhone/Android audible speech remains a separate test.
