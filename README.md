# Rise_Voca

A four-choice English learning PWA for age five, with daily PK1 lessons, weekly packs, native Unicode emoji and original CSS. Learner history stays on the device. No accounts, microphone, AI API, advertising, analytics, or cloud sync.

## Learn and resume

Open **My lessons**, choose a week and a lesson. Every full lesson includes all its Core Words and Key Words, including words repeated on other days. A shared vocabulary item never shares lesson completion. Display names follow `Class_Theme_Lesson`, for example `PK1_4 - Weather Report_6`; source class `PK1_2603` remains separate.

Keep four choices, gentle retries, Hint, Listen, Skip, first-attempt stars, four-question breaks, Save & pause, Resume and Replay. Keyboard: 1-4/Numpad1-4 answers, Space listens, Ctrl alone shows a hint. Quick review supports multiple lessons and All / 5 / 10 / 15 / 20 / custom counts. Partial review does not complete a daily lesson.

## English Voice Settings

Open **Parent & Settings > English Voice Settings**. **Automatically read each clue** defaults to checked, including when older saved settings do not contain this preference. An explicit off setting survives reload. Each newly presented question receives at most one automatic request; wrong answers, hints, voice refreshes and ordinary re-renders do not replay it. Resume does not repeat a stored automatic request. Listen remains available for manual replay or when the browser blocks automatic speech.

Settings retain `speechLang`, `voiceURI`, `voiceName`, `voiceLang`, `speed`, and the new `autoReadClue` boolean in the existing IndexedDB settings record. Accents: Auto / en-GB / en-US / en-AU / en-CA / en-IE / en-NZ. Speeds: 0.75 / 0.9 / 1.0, synchronized with the quiz. Voices come from the device, never hard-coded names. Saved exact identity falls back through preferred accent, local English, other English and system default; offline prefers a local English pool without erasing the saved choice.

Automatic and manual listening requests are labelled in Session details. A request does not prove that sound played or that the child heard it. Test voice, settings and picture previews never create learning evidence. No speech recognition or pronunciation score is used. Real Safari/iPadOS/Android voices and audible offline playback still need physical-device checks.

## Content release 2026.10.06.2

The 43-image source archive was checked against the existing library: **25 existing lessons were skipped and 18 new lessons added**. The library now has **43 lessons in 22 Monday-Sunday packs and four themes**, with **231 ready questions**, one unresolved vocabulary sense and seven source-gap bookkeeping records. Source gaps are not learning words. Thirty-four lessons are complete; nine offer partial review while source details are clarified. Every full lesson's coverage is tested.

See `docs/ZIP43_IMPORT.md` and `data/import-audits/2026-10-06-zip43.json` for the full add/skip ledger, source hashes, unchanged old lessons and the date-qualified ID used for the new 23/05 Letters M-P sheet. Existing source issues were not rewritten by this add-only import.

The parent confirmed **Turning green Bloom** as one phrase and **Light rain / Heavy rain** as weather terms. Their stable existing IDs are retained, and all seven Weather Report lessons are complete. Lessons include explicit upper/lower letter forms, numbers 1-20 and colour recognition, without normalizing away case or singular/plural source forms.

See `docs/CONTENT_MAINTENANCE.md` for the source-pack contract and earlier unresolved rows. Source filename/hash, printed theme and reading title are retained. Original scans and full copyrighted story text are not redistributed. New clues are explicitly app-authored; the speaking appendix is reference-only and is not speech assessment.

## Illustrations

Seven reference emoji mappings remain unchanged. There are 116 candidate mappings requiring parent review, including 19 added by the 43-sheet import. Eighty-three letter, numeral and solid-colour cards are intrinsic stimuli, not sourced artwork. No external illustration files or font files are bundled. Missing pictures stay explicit; context clues remain answerable without one.

Use **Parent & Settings > Review emoji & CSS illustrations** to inspect and approve/reject each candidate. Approval is local and keyed to exact item/recipe identity. Emoji artwork varies by device. An approved generic plant is never silently substituted for a specific species.

## History, privacy and backups

Learning History provides Sessions, By topic, By word/item and complete attempt timelines. Filters combine dates, actually encountered topics/lessons and status. Times are based on the device clock and displayed in Asia/Ho_Chi_Minh. Paused/background time is excluded from estimated active learning time.

Session snapshots preserve original questions, option order, attempts, supports and exactly-once first-correct evidence across library updates. One tab writes at a time. The storage namespace, database version and existing history are not reset by this release. Legacy trigger-less Listen events remain valid.

**Back up all history** exports all sessions including unfinished ones, independent of report filters. Restore validates and atomically merges: identical sessions are ignored; conflicts reject the import without overwriting. CSV and single-session reports are not full backups. Library, image metadata, image reviews and voice preferences are separate exports. Phone and tablet do not synchronize automatically; browser eviction or clearing site data can erase local progress.

## Author, build and test

The original base catalogs remain in `data/library.json` and `data/illustrations.json`. New canonical inputs live in `data/lesson-packs/*.json`; `scripts/catalog.mjs` composes them and rejects duplicate IDs. The complete exportable runtime catalogs, week packs, icons, service worker and fingerprints are generated in `dist/`. Never hand-edit generated copies.

```sh
npm run validate
npm test
npm run build
node scripts/build.mjs --check
node scripts/check-pages.mjs
python -m pip install playwright==1.57.0
python -m playwright install chromium
python tests/browser.py --report test-results/browser.json
python tests/auto_browser.py --report test-results/automatic-clues.json
```

The application build needs Node.js 22+ and no npm dependencies. Browser tests use disposable profiles and synthetic voices. The optional `tests/dom_smoke.py` is explicitly mock-only and cannot establish persistence or offline behavior. Historical reports in `verification/` and `docs/DELIVERY_STATUS.md` describe the original handoff, not current CI status; consult the workflow run for each commit.

## Publish and update

In **Settings > Pages**, select **GitHub Actions**, not branch/Jekyll publishing. `.github/workflows/pages.yml` validates, builds, runs real-origin browser tests, publishes only `dist/`, and verifies deployed bytes. Generated `dist/` is no longer tracked: it is rebuilt for each deployment. Do not upload the source root as the website. Keep `.nojekyll` as a hosting marker, never an offline dependency.

Service-worker caches are scoped to this app. All required downloads must complete before offline readiness is claimed. Updates never clear IndexedDB or another app's cache. Save & pause, close all Rise_Voca windows and reopen to receive an update; do not clear site data. Install through Safari Share > Add to Home Screen on iOS, or the browser's installation menu on Android. Offline content does not guarantee offline speech.

See `docs/PAGES_DEPLOYMENT.md` for the original deployment repair and `THIRD_PARTY.md` for attribution boundaries.
