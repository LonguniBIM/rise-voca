# Maintain daily lessons and weekly packs

## Canonical inputs and generated outputs

Keep `data/library.json` and `data/illustrations.json` as the original base catalogs. Add versioned authoring packs in `data/lesson-packs/`, ordered by filename. `scripts/catalog.mjs` composes all inputs; `scripts/build.mjs` produces the complete runtime catalogs in `dist/data/`, Monday-Sunday week packs and fingerprints. The app's Export library JSON always exports the complete composed library, not just the base file. Generated dist files are rebuilt in CI, not committed or edited separately.

The pack `2026-10-06.json` is the working example. Each word row is `[stableId, displayWord, VietnameseMeaning, authoredClue, threeDistractors, hint, emojiOrEmpty]`. Every row compiles to four distinct choice IDs and one exact correct ID. `letters`, `numberWords` and `colors` expand only explicitly supported form/number/colour targets. Their stimuli are text or CSS, not approved image assets. New semantic emoji/CSS drawings require manual review.

Each lesson has independent `core` and `key` arrays. Reuse an item ID only for the same sense/form, but include it again in every lesson that teaches it. A review sample must not complete all lessons containing a repeated word. Printed class, theme, date, lesson number and source filename/hash accompany every new lesson. New clue wording is not a quotation from the source. The speaking appendix is normalized for punctuation/spacing, remains unscored, and never invents a child's answers.

Use `pending` records for uncertain senses. Use `recordType: source-gap` for clipped boundaries whose true target count is unknown. These bookkeeping records block a full lesson but are excluded from the known target total; they never become quiz questions. Clear readable targets remain available in partial review. Do not guess cropped words from nearby days or from an unrelated appendix.

Explicit parent resolutions are recorded in `resolutions` and `replacements`. Replacements may resolve an existing pending item while keeping its original ID and originalText; they do not rewrite historical session snapshots. Do not alter old storage namespaces or regenerate IDs.

## Confirmed Weather Report decisions

- `Turning green Bloom` is one parent-confirmed supplied phrase. Keep its original pending-era ID. The authored explanation uses the ordinary sentence 'Plants turn green and flowers bloom' without splitting the target.
- `light` and `heavy` are used with rain. Teach Light rain and Heavy rain under their original IDs.
- All seven Weather Report lessons are complete. The original cloudy/rainy source appendix inconsistencies remain reference-only; the seven original quiz questions are still tested exactly.

## New source issues requiring confirmation

| Source date | Issue | Current behavior |
| --- | --- | --- |
| 04/07/2026 | Header says Theme 1 ABC Workshop / ABC Name Train, but title is Numbers 11-13 and reading says Ant Disaster | Preserve printed name `PK1_1 - ABC Workshop_5`; words are usable; metadata issue displayed |
| 15/08/2026 | Bottom of the key-word list clips the Pen row and its boundary | Keep readable words; source-gap blocks a claim of complete coverage |
| 22/08/2026 | Earth could refer to soil/ground or the planet | Keep the sense pending; do not assign a globe |
| 23/08/2026 | Key-word row clipped at both ends | Keep Giraffe, Bear, Rabbit, Bean, Peach; do not infer Penguin or Tree trunk |
| 06/09/2026 | Both ends of the core colour list are clipped | Keep six fully readable colours and five key words; do not reconstruct hidden colours |

Source `pepperonis` remains the plural supplied form. Source colour-mixing statements are unscored reference text, not universal science rules.

## Verification and release

Run validation, unit tests, build, deterministic output check, publishing-directory check, `tests/browser.py` and `tests/auto_browser.py`. Compare coverage before/after, review each full lesson's targets and check new stimuli at phone/tablet sizes. Re-check remote main before committing; never force-push. Workflow deployment and its live-byte check are separate from local test success.

Content release 2026.10.06.1: 25 lessons, 19 weeks, 4 themes, 191 ready items, 1 pending sense and 3 source-gap records. There are 365 item-to-lesson membership records, including the three source-gap placeholders; 21 lessons are complete. Keep source counts separate from unique answer spellings and illustration counts. Future additions may legitimately change these totals.
