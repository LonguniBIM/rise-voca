# Add a daily lesson without losing coverage

1. Transcribe the source Core Words and Key Words separately. Preserve original question/answer patterns as an unscored parent appendix. Record uncertainties rather than guessing meanings.
2. Reuse an item ID only for the same meaning/form. Add all relevant `targets` to the new lesson, including repeated words. Use role `core` or `key`. Do not mark a lesson complete from a review session.
3. Retain source class `PK1_2603`, stable lesson ID, date, theme ID and lesson number. Display name: `PK1_4 - Weather Report_6`. Weekly packs derive from the source date, Monday through Sunday.
4. A ready item needs one clear clue, four distinct choice IDs/labels, one correct ID, a nonspoiling hint, explanation and provenance. Label app-authored clues separately from supplied quotations. A pending item retains its printed spelling and reason, with no fabricated question.
5. Add a registry record for the exact meaning. Prefer Unicode/CSS. New drawings start `needs-review`; use `missing` for unsuitable/unavailable pictures. Typographic letter cards are `non-pictorial`. Do not use an inaccurate generic plant for a specific plant species. Bump `styleVersion` when a drawing changes.
6. Increment the content version, run `npm run validate`, `npm test`, `npm run build`, deterministic check and the browser suite. Review the generated coverage report and every full lesson's target list before publication.

The JSON in `data/` is canonical. `dist/data/weeks/`, the runtime catalogs and BUILD_INFO are derived outputs, not separately edited copies. New content never resamples an unfinished session. All historical questions retain their original snapshots.

## Initial source clarifications

- Weather lesson 2 (19 September 2026): `Turning green Bloom` stays one unresolved printed record until its intended segmentation is confirmed.
- Weather lesson 3 (20 September 2026): `light` and `heavy` stay unresolved rather than being assigned guessed weather/weight/light meanings.
- Weather lesson 5: supplied sunny/windy answer patterns are kept as source reference; they are not silently rewritten as quotations.
- ABC A a through D d: each printed pair is deliberately expanded into two case-sensitive form targets. `uppercase` and `lowercase` remain additional vocabulary targets.

App-authored botanical clues were checked against USDA Forest Service White Oak (`https://research.fs.usda.gov/silvics/white-oak`) and U.S. National Park Service Milkweed and Monarchs (`https://www.nps.gov/articles/000/milkweed-and-monarchs.htm`). These are external checks for newly authored clues, not claims that the supplied lesson sheets contain those definitions. No photos from those pages are distributed.
