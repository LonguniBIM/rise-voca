# Licensed illustration libraries

The parent requested external libraries for words that native emoji do not represent clearly, using `LonguniBIM/voca-flyers` as a reference. The reference was inspected at `c55b9332c82fa64a77455713b5d842758b323fcf`, including its explicit mapping, download/validation script, manifest, attribution and local review workflow. That repository remains read-only.

## Release scope

`data/lesson-packs/2026-11-15b-illustrations.json` adds **28 external picture mappings using 28 distinct SVG files**. It also adds a native Blueberry candidate; that question identifies the fruit and does not assess singular/plural quantity. Existing non-missing emoji/CSS records are not replaced or re-approved.

| Library | Mappings |
| --- | --- |
| Mulberry Symbols | Act out, Arms, Beside, Body parts, Button, Caterpillar, Earth (soil/ground), Fingers, Head, Jam, Jelly beans, Jump, Machine, Neck, On, Parts, Pea, Pond, Room, Skirt, Touch, Tree trunk, Under, Wiggle, Zipper |
| Material Design Icons | Bottle, Mat |
| Game-icons.net | Igloo |

Every SVG was rendered and visually inspected before selection. Upstream bytes remain unchanged. Body parts displays three separate Mulberry images in an HTML layout, with full component provenance and its own approval identity. It is not a new or edited SVG file. Source versions and notices are recorded in `THIRD_PARTY.md` and each mapping.

## Semantic decisions

- Head is a complete profile, Arms depicts two arms, and Fingers points to a group of fingers. Jump is airborne; Wiggle includes movement marks around a finger.
- Earth uses a ground/soil cross-section, never a globe.
- Button is a sewing button. Parts shows separate interlocking toy-puzzle pieces. Machine shows a printer, an example already named in the clue.
- On, Beside and Under show the correct spatial relation without reproducing every object in the verbal example. Touch shows contact with a surface while its clue describes touching the nose. Parent review makes the picture examples explicit.
- Act out uses a performer on a stage. It does not assess the child's acting or speech.

Nine words still lack a sufficiently exact selected picture:

| Word | Why the examined alternatives were not attached |
| --- | --- |
| Customer | Shopping objects alone do not identify a person buying from a shop |
| White oak | A generic tree does not identify this species |
| Milkweed | A generic flower does not identify this plant |
| Trace | The examined symbol traces around a hand, rather than following the dotted guide in the clue |
| Queen | A crown, princess or chess piece alone does not establish a woman ruling a kingdom |
| Pepperonis | Generic sausage/salami images do not clearly depict the supplied pizza-slice sense |
| Snowball | Snowflakes and snowmen do not depict a ball made from snow |
| Shoulders | The available symbol marks one shoulder; the target and clue explicitly refer to two |
| Stretch | The examined symbol stretches an elastic object, rather than extending the arms |

These items remain answerable through authored clues. No inaccurate substitute is attached to raise coverage. The missing-image export distinguishes absent, unapproved and rejected candidates.

## Authoring and validation

Ordered packs may contain an `illustrations` array. Each entry fills only a currently missing record and starts as `needs-review`. It cannot overwrite an existing recipe. Word/question IDs and earlier lessons remain unchanged.

External records use `kind: "svg"`, `assetPath`, `sha256`, `sourceUrl`, `sourceVersion`, `creator`, `provider`, `license`, `licenseUrl` and `licensePath`. Groups may use `additionalAssets`, with the same provenance fields per component. Local filenames contain digest prefixes. Do not overwrite or delete a published picture path; saved session snapshots can retain it. Revising an already mapped picture requires an explicit versioned migration rather than editing an old pack.

`scripts/illustration-assets.mjs` validates local paths, exact content hashes, source pins and supported licenses/notices. It rejects SVG scripting, external resources, visible text labels, embedded raster images, unknown elements and oversized files. Images render through `img` elements, never HTML injection. `.gitattributes` disables SVG newline normalization so upstream bytes are preserved.

Approval identity includes the item, existing recipe fields and every component's exact path/hash. The old Unicode/CSS identity calculation is unchanged. Changing any component gives the group a fresh identity; approvals do not transfer between words.

## Parent review and offline behavior

Open **Parent & Settings > Review illustrations**. Inspect a word's picture, meaning and source, then approve or reject. SVG approval stays disabled until all components load. Broken pictures fall back to verbal clues and cannot be approved from a failed preview. Reviewing creates no sessions, scores or learning events.

Images, notices and credits are bundled and precached with hashes. An incomplete or corrupted required image prevents offline readiness. The publishing gate verifies that every referenced asset is cached; live checks verify exact bytes and SVG MIME. Lessons make no third-party image requests. Upstream links load only if the parent opens them.

Library/image exports contain provenance and local paths, not embedded SVG bytes. Reviews stay device-local and export separately. Old paused sessions keep their saved illustrations. This release does not clear IndexedDB, change the app namespace or publish private learner/review data.
