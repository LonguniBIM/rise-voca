# Source and illustration notices

## Native and original illustrations

The application uses native Unicode emoji rendered by the device's installed system fonts and original CSS layouts. No font files are redistributed. Native glyph artwork varies by device. The app icons are original geometric drawings.

## Bundled SVG illustrations

The November 2026 illustration pack includes selected SVG files from these libraries. Every SVG is copied unchanged from the pinned upstream revision. Per-word provenance, original source URL, license, SHA-256 and local path are in `data/lesson-packs/2026-11-15b-illustrations.json` and the generated `data/illustrations.json`. No remote image server is contacted while learning.

| Library | Attribution | License | Pinned revision | Local notice |
| --- | --- | --- | --- | --- |
| [Mulberry Symbols](https://mulberrysymbols.org/) | Mulberry Symbols by Steve Lee; copyright 2018-2026 Steve Lee | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `9cbab9f400c5de44e2bc58839cca07294aadb086` | [Notice and license](assets/licenses/mulberry-license.txt) |
| [Material Design Icons](https://pictogrammers.com/library/mdi/) | Pictogrammers contributors | [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) | `9e04201d4557e729822fb57f62a316c3dea1d4a8` | [Notice and license](assets/licenses/pictogrammers-license.txt) |
| [Game-icons.net](https://game-icons.net/1x1/delapouite/igloo.html) | Igloo icon made by Delapouite | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | `82d948812bfe3f269ef8f731dcdb07b08160edc4` | [Upstream notice](assets/licenses/game-icons-license.txt) |

Mulberry covers 25 word mappings, including Body parts. Body parts is an app layout displaying three separate, unmodified Mulberry images: head, arms and feet. Each retains its attribution and CC BY-SA 4.0 terms. No flattened or edited derivative SVG is distributed. Any future derived Mulberry symbol must remain available under the same or a compatible license.

The two Material Design Icons are Bottle and Mat. Neither is a brand or logo. The Game-icons.net file is Igloo. These notices and images are included in the offline bundle and accessible from Parent & Settings > Review illustrations. Following upstream source or license links requires a connection; reading bundled notices does not.

Parent approval is separate from attribution and automated validation. New pictures require device-local review before appearing in lessons. Review decisions and learner histories must never be committed to this repository.

## Parent-supplied teaching material

The parent supplied lesson targets and the original seven-question quiz. School scans, the corporate logo and complete stories are not redistributed. Source records contain transcribed vocabulary, speaking patterns, filenames, hashes and short home-reading summaries. No additional school materials, recordings or learner data are published by this release.

## Development tools

Development-only browser tests use Microsoft Playwright (Apache-2.0), installed from PyPI by CI. GitHub workflow actions retain their upstream licenses. These development tools are not runtime CDN dependencies.
