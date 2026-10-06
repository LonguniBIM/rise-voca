# Add-only import of 43 lesson sheets

## Scope and matching

Source archive: `fff992bc8bc20b9c52d343(1).zip`.
SHA-256: `1e2cd22efdc781226b2ebb139fdb66d985cb941eae8e505d2bf67a0c90542e2d`.
Baseline: `887911477d991772edfbded0a5e1ad6490e7578c`.
Content release: `2026.10.06.2`.

The archive contains 43 JPGs with 43 distinct byte hashes. Match existing source
SHA-256 values where available, then compare class, printed theme, lesson number
and ISO lesson date. Seventeen existing sources match by hash and identity;
eight original sources match by lesson identity because their base records did
not store a source hash. The outcome is **25 existing lessons skipped and 18 new
lessons added**. A filename suffix such as `(1)` is not lesson identity.

The complete per-image ledger is `data/import-audits/2026-10-06-zip43.json`.
New canonical data is `data/lesson-packs/2026-10-06b-zip43.json`, ordered after the
previous pack. Do not re-add the 25 skipped lessons or use this import to change
old pending targets. Rechecking this archive after import must return 43 skips.

## New lessons

| Theme | New lesson numbers | Dates in 2026 |
| --- | --- | --- |
| 1 - ABC Workshop | 2, 4, 5, 6, 7, 10, 11, 12 | 10/05, 16/05, 23/05, 24/05, 30/05, 07/06, 13/06, 14/06 |
| 2 - Ant Disaster | 3, 8, 10, 12 | 27/06, 12/07, 19/07, 26/07 |
| 3 - Edmo the Wizard | 2, 3, 6, 9, 10, 12 | 02/08, 08/08, 16/08, 30/08, 05/09, 12/09 |

The 23/05 Letters M-P sheet shares the printed name `PK1_1 - ABC Workshop_5`
with the existing, mislabelled 04/07 Numbers 11-13 sheet. They have different
content and dates. Preserve the old `pk1-2603-t1-l5` ID and give the new sheet
`pk1-2603-t1-l5-20260523`. Preserve both printed names and show their dates; do
not silently reclassify the July sheet as Theme 2.

Within a lesson, repeated source-column entries (for example Hat or Wizard)
are assessed once per sense/form, with the original printed lists retained.
Across different lessons the same item is required independently. Singular
Tomato and Leaf remain separate from the existing Tomatoes and Leaves forms.

## Coverage and unresolved source content

| Metric | Before | After |
| --- | ---: | ---: |
| Lessons | 25 | 43 |
| Monday-Sunday packs | 19 | 22 |
| Themes | 4 | 4 |
| Ready question items | 191 | 231 |
| Full lessons | 21 | 34 |
| Partial-only lessons | 4 | 9 |
| Pending vocabulary senses | 1 | 1 |
| Source-gap bookkeeping records | 3 | 7 |
| Total item records | 195 | 239 |
| Item-to-lesson memberships, including source gaps | 365 | 812 |

Forty ready items are added: 24 word/sense records and 16 uppercase/lowercase
I-P forms. Four source-gap records are not learning words or quiz questions.
The new lessons comprise 13 full lessons and five partial-only lessons:

| Date | Lesson | Why full coverage is not claimed |
| --- | --- | --- |
| 13/06/2026 | ABC Workshop 11 | Key Words contains an ellipsis; only Apple, Bird, Cow, Yarn and Zebra are explicit |
| 14/06/2026 | ABC Workshop 12 | Same incomplete Key Words list; omitted vocabulary is not borrowed from other days |
| 30/08/2026 | Edmo the Wizard 9 | Reuses the existing unresolved Earth sense; soil/ground versus planet is still unconfirmed |
| 05/09/2026 | Edmo the Wizard 10 | Both boundaries of the core colour row are clipped |
| 12/09/2026 | Edmo the Wizard 12 | Both boundaries of the core colour row are clipped |

A-Z is explicitly stated on the June review sheets; expand the full upper/lower
alphabet, not omitted Key Words. The 16/08 colour sheet's letter-based speaking
appendix is preserved as unscored source reference, with a metadata warning.
Penguin is explicit on 30/08, but this does not resolve the clipped 23/08 sheet.
The four pre-existing partial lessons and all previous source issues stay unchanged.

## Preservation and illustrations

No changes are made to `src/`, the storage schema, voice preferences, automatic
clue behavior, scoring, service-worker implementation, or previous authoring
packs. Existing lesson/source definitions and illustration recipes are covered
by deep-equality regression checks. Shared items gain source/topic memberships;
their old questions, answers and semantic content remain unchanged. Old learner
sessions retain their own question snapshots.

Nineteen new emoji candidates require parent review; none is auto-approved.
Sixteen letter forms are intrinsic text stimuli. Five new words have no suitable
attached illustration: Pea, Igloo, Jam, Machine and Skirt. Overall there are seven
retained mappings, 116 review candidates and 83 intrinsic stimuli. No external
image assets or font files are added. Source scans and full stories are not
published; source filenames, hashes, vocabulary and reference patterns are retained.

## Verification and release

`tests/zip43.test.mjs` checks the 43-row ledger, source hashes, add-only behavior,
unchanged old definitions, the printed-name collision, exact per-lesson coverage,
partial-only gates, and a repeat check with zero further additions. Its baseline
is bounded to this release so future authoring packs do not alter this historical
comparison. Existing browser tests derive lesson totals from the built catalog
rather than assuming the previous count of 25.

Run the existing validation, Node test suite, deterministic build and publishing
checks plus both real-origin browser suites before release. The Pages workflow
publishes only built `dist/` and checks deployed bytes. Consult the actual workflow
run for pass/fail evidence; this document is not itself a test execution report.

The content changes alter the deterministic build/cache version automatically.
Use Save & pause, close all Rise_Voca windows and reopen to receive the release.
Never clear site data or reset IndexedDB as an update procedure. Physical-device
installation and audible offline speech are separate from synthetic-voice tests.
