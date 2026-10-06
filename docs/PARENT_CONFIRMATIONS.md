# Parent-confirmed corrections: content 2026.10.06.3

This is the specification and implementation contract for the latest explicit parent decisions. Deployment evidence is separate; do not infer release success from this document.

## Decisions

| Code | Unit and lesson | Applied rule |
| --- | --- | --- |
| C01 / C02 | Unit 1, Lessons 11 and 12 | Union all Key Words of Lessons 1-10; retain the explicitly printed Bird; preserve the existing 52 A-Z upper/lower targets |
| C03 | Unit 3, Lesson 5 | Pen is the last of Magic, Glasses, Map, Magic beans, Umbrella, Pen |
| C04 / C06 | Unit 3, Lessons 7 and 9 | Earth means soil/ground, not the planet |
| C05 | Unit 3, Lesson 8 | Complete the list with Penguin and Tree, not Tree trunk |
| C07 / C08 / C09 | Unit 3, Lessons 10, 11 and 12 | Union all Core Words from Lessons 1-9; keep each lesson's five Key Words |
| M01 | July 4, Numbers 11-13 | Correct to Unit 2 - Ant Disaster, Lesson 5, Number Song; retain historical ID pk1-2603-t1-l5 |
| M02 | Unit 3, Lesson 6 | Copy Key Questions and Key Sentences exactly from Unit 3 Lesson 5 |
| M03 | Unit 4, Lesson 5 | Use cloudy/rainy in the speaking patterns; do not change the seven original quiz questions |
| V01 | Unit 4, Lesson 2 | Replace the combined target with Turning green and Bloom; no transfer of learning credit |

The new canonical pack is data/lesson-packs/2026-10-06c-confirmed.json. Older input packs and the ZIP43 import audit remain historical records. Their formerly unresolved rows are not the current source of truth after applying this pack.

## Data and history boundaries

The build composes original catalogs and ordered packs, then applies corrections with an explicit parent authority. Existing printed metadata, lists and speaking patterns are retained under originalSource; source records expose effectiveMetadata separately. The combined item and seven resolved source-gap placeholders are archived, not offered as new quiz questions. Source scans are not added.

The July lesson keeps its existing ID so old sessions still refer to the same lesson. New sessions use the corrected Unit 2 name and topic. The May 23 Letters M-P lesson retains its date-qualified ID. Historical session names, questions, choices, topic snapshots, submitted attempts and first-correct results are never rewritten.

Turning green and Bloom have distinct IDs and new question/illustration identities. Prior success with the combined phrase is not copied to either new target. New emoji cues require parent review; Earth remains a verbal soil/ground cue rather than receiving an inaccurate globe.

The home completion indicator compares exact target IDs. Older completed sessions remain visible in history but cannot claim completion of a lesson that now has additional or split targets. The newest-first weekly order is preserved. No database migration, schema reset, cache clearing, speech preference change or scoring rewrite is required.

## Expected release contract

The release tests require 43 lessons, 22 weeks, four topics, all 43 lessons ready, 233 active ready items, no active source gaps or unresolved vocabulary, and eight archived items. Unit 1 review lessons include 39 Key Words plus 52 letter forms; each colour review has 11 core colours plus five Key Words; Weather Lesson 2 has nine targets. These are executable assertions, not a claim that CI has run.

## Verification before publication

Run npm run validate, npm test, npm run build, node scripts/build.mjs --check and node scripts/check-pages.mjs. Run both existing real-origin suites: python tests/browser.py --report test-results/browser.json and python tests/auto_browser.py --report test-results/automatic-clues.json. Historical catalog tests are bounded to the earlier import version, while confirmed-catalog.test.mjs checks the current confirmations. corrections-unit.test.mjs exercises atomic failure, source unions, archival, stable metadata and completion comparisons.

After an authorized commit, verify the Pages workflow and deployed bytes separately. Save & pause and reopen all app windows to upgrade; never clear the learner's site data. Physical iOS/Android speech and installation remain separate acceptance tests.
