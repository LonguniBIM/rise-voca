# Rise_Voca

A four-choice English learning PWA for age five, with daily PK1 lessons, weekly packs, native Unicode emoji and original CSS. Learner history stays on the device. No accounts, microphone, AI API, advertising, analytics, or cloud sync.

## Learn and resume

Open **My lessons**, choose a week and a lesson. Every full lesson includes all its Core Words and Key Words, including words repeated on other days. A shared vocabulary item never shares lesson completion. Display names follow `Class_Theme_Lesson`, for example `PK1_4 - Weather Report_6`; source class `PK1_2603` remains separate.

Keep four choices, gentle retries, Hint, Listen, Skip, first-attempt stars, four-question breaks, Save & pause, Resume and Replay. Keyboard: 1-4/Numpad1-4 answers, Space listens, Ctrl alone shows a hint. Quick review supports multiple lessons and All / 5 / 10 / 15 / 20 / custom counts. Partial review does not complete a daily lesson.

## English Voice Settings

Open **Parent & Settings > English Voice Settings**. **Automatically read each clue** defaults to checked, including when older saved settings do not contain this preference. An explicit off setting survives reload. Each newly presented question receives at most one automatic request; wrong answers, hints, voice refreshes and ordinary re-renders do not replay it. Resume does not repeat a stored automatic request. Listen remains available for manual replay or when the browser blocks automatic speech.

Settings retain `speechLang`, `voiceURI`, `voiceName`, `voiceLang`, `speed`, and the new `autoReadClue` boolean in the existing IndexedDB settings record. Accents: Auto / en-GB / en-US / en-AU / en-CA / en-IE / en-NZ. Speeds: 0.75 / 0.9 / 1.0, synchronized with the quiz. Voices come from the device, never hard-coded names. Saved exact identity falls back through preferred accent, local English, other English and system default; offline prefers a local English pool without erasing the saved choice.

Automatic and manual listening requests are labelled in Session details. A request does not prove that sound played or that the child heard it. Test voice, settings and picture previews never create learning evidence. No speech recognition or pronunciation score is used. Real Safari/iPadOS/Android voices and audible offline playback still need physical-device checks.

## Parent confirmations: content 2026.10.06.3

The latest parent-confirmed corrections keep the same 43 lessons and 22 weekly packs. They resolve the nine partial lessons, correct July 4 to Unit 2 - Ant Disaster / Lesson 5 / Number Song, and update the requested speaking patterns. The release gate requires 233 active ready items and all 43 lessons ready; use CI and the deployed build marker as publication evidence.

Unit 1 Lessons 11 and 12 review all Key Words from Lessons 1-10, with the explicitly printed Bird retained. Unit 3 Lessons 10-12 review all Core Words from Lessons 1-9. Per-lesson repeated-word coverage is preserved. Earth means soil/ground; Penguin and Tree complete Unit 3 Lesson 8, and Pen ends Lesson 5.

**Turning green** and **Bloom** are now separate targets, superseding the earlier combined decision. The old combined item and resolved source-gap records are archived for provenance, never converted into learning credit for the new targets. **Light rain / Heavy rain** remain unchanged. Historical session snapshots and IDs are retained; an older solved session does not complete an expanded target list.

See `docs/PARENT_CONFIRMATIONS.md` for the exact decisions and preservation contract. `docs/ZIP43_IMPORT.md` and `data/import-audits/2026-10-06-zip43.json` describe the earlier add-only import, not current unresolved issues. Printed source metadata remains available separately from parent-corrected effective metadata. Original scans and full stories are not redistributed.

## Illustrations

Seven reference emoji mappings remain unchanged. Turning green and Bloom have new candidate cues requiring parent review; the combined cue is archived. Earth is described as soil/ground without substituting a globe. Eighty-three letter, numeral and solid-colour cards are intrinsic stimuli, not sourced artwork. No external illustration files or font files are bundled. Missing pictures stay explicit; context clues remain answerable without one.

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
