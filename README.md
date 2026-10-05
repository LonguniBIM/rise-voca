# Rise_Voca

> **Local pre-release: application publication was blocked. The app is not on main or deployed. See `docs/DELIVERY_STATUS.md` for actual test evidence and remaining release gates.**

A phone/tablet-friendly, four-choice English quiz for age five. Weekly PK1 lesson packs, native Unicode emoji and original CSS, private learning history, and real device voice selection. No account, microphone, AI API, ads, analytics, or automatic cloud synchronization.

## Learn by day

Choose **My lessons > Week > Let's learn**. Full lessons include every assigned Core Word and Key Word, including words repeated on another day. Names follow `Class_Theme_Lesson`, such as `PK1_4 - Weather Report_6`; the source class `PK1_2603` is retained separately. Letter A/a through D/d are distinct form targets, not case-normalized answers.

Four questions form a short round. Listen, Hint, unlimited retries, Skip, Save & pause, Resume, and Replay are available. Answer keys 1-4 and Numpad1-4 work; Space listens; Ctrl pressed alone opens the hint. Browser shortcuts and text inputs are not intercepted. First-attempt stars and hint-free first-attempt outcomes are distinct. A skip is never counted correct.

Quick review accepts multiple lessons and All / 5 / 10 / 15 / 20 / custom counts. Shared spellings may be deduplicated in review, but review does not complete their source lessons. **Practise tricky words** uses the most recent seen outcome: unfinished/skipped, multiple attempts, hint or written-clue support. Listening by itself is not a failure. No mastery or pronunciation score is invented.

## Initial library

Eight lesson records, five Monday-Sunday packs, two themes, 61 learning-item records, 79 lesson memberships, 58 ready questions and 54 distinct case-normalized answer spellings. Eight letter-form targets deliberately preserve A/a differences.

Six lessons can be learned in full. Weather Report Lesson 2 and Lesson 3 allow clearly labeled partial review only until the parent confirms these three unresolved source records:

- `Turning green Bloom`: whether the printed line represents two targets and their intended forms.
- `light` and `heavy`: their intended meanings in the weather-machine lesson.

No target is silently dropped to declare a full lesson ready. Original source question/answer patterns are reference-only, including inconsistencies in the cloudy/rainy sheet. New quiz clues are marked as app-authored. The original seven Cloudy and Rainy quiz prompts, alternatives, hints, translations and explanations are regression-tested exactly. Source scans and the full original story text are not redistributed.

## English voices on iPad, iPhone and Android

Open **Parent & Settings > English Voice Settings**. Select preferred accent, an English voice exposed by the current device, and speed 0.75 / 0.9 / 1.0. The quiz speed control uses the same setting. **Refresh voices** reloads the device list. **Test voice** is completely separate from learning events, even when a session is paused.

Saved keys: `speechLang`, `voiceURI`, `voiceName`, `voiceLang`, `speed`, in this app's IndexedDB settings record. Fallback: saved exact identity (URI, then name/language) -> preferred accent -> local English -> other English -> browser default. Offline, an available local-English pool takes precedence over a saved remote voice, without erasing the saved preference. Startup retries, `voiceschanged`, foreground/page resume and manual refresh handle delayed lists. No hard-coded device voice names are shipped.

An on-device label is a browser capability hint, not proof of audible offline speech. Download a suitable English system voice as supported by the device and test after going offline. PWA installation cannot install a voice or guarantee Safari will expose it. No microphone or speech recognition is used.

## Pictures

Native Unicode + original CSS is first choice. Seven mappings are retained from the supplied reference, not retroactively labeled user-approved. Forty new candidates require review at **Parent & Settings > Review emoji & CSS illustrations**. Preview the actual cue and its meaning; choose Approve or Reject. Decisions stay local, are scoped to exact item/recipe identity, and never create learning credit. Eight letter cards are non-pictorial learning content.

Six records have no suitable attached image: customer, white oak, milkweed, and the three unresolved source records. Context questions remain usable without an image. External fallback assets have not been attached or automatically approved in this release. There are zero external illustration files. The gallery explicitly reports missing, rejected and unreviewed cues. Native emoji artwork can differ across operating systems; no font files are bundled.

## History and backup

**Learning History** has Sessions, By topic, By word/item and detailed attempt timelines. Combine session-start From/To dates, actually studied topic, lesson and status. Word/meaning search narrows item reports. The To date includes the whole day in Asia/Ho_Chi_Minh. Timestamps come from the device clock; durations distinguish elapsed time from estimated non-idle foreground time.

Each submitted answer is saved before the UI reports success. Original question/option snapshots, order, supports and exactly-once first-correct evidence survive reloads and library updates. Only one tab may write at a time; another tab becomes read-only. No fixed retention limit deletes older sessions.

Use **Parent & Settings > Back up all history**. This is a full JSON backup, including unfinished sessions, independent of screen filters. **Restore / merge** validates first and atomically adds new sessions; identical sessions are ignored; conflicting same-ID sessions reject the entire import. A backup from a newer state of the same session conflicts with an older local copy rather than silently overwriting it. Keep both files and reconcile explicitly.

Library JSON, library + illustration metadata, image reviews, missing-image inventory and voice preferences are separate exports, not history backups. Preferences/reviews are not restored by the history importer; they remain separate documented exports. CSV and single-session JSON are reports, not restorable full backups. CSV exports follow report filters and escape spreadsheet formulas.

History stays in this browser/PWA container and origin. Phone and tablet do not sync automatically. Browser eviction, private browsing or clearing site data can remove local data. A persistent-storage request is best effort, not a backup. Storage failure exposes a temporary-memory warning or pauses writes for export; it never silently claims a save.

## Build and run

Node.js 22+ and Python 3 are sufficient for the application build. No npm packages or runtime CDNs are required.

```sh
npm run validate
npm test
npm run build
node scripts/build.mjs --check
npm run serve
```

Open `http://localhost:4173` on the same development computer. Deploy **dist/** to HTTPS for phone/tablet installation. An arbitrary LAN HTTP address is not the localhost secure-context exception on a different device.

The initial proposal mentioned Vite/TypeScript. This implementation instead retains standard JavaScript ES modules and uses a small deterministic Node build, preserving the supplied plain-HTML interaction without a framework rewrite or network-dependent npm install. Content, domain, storage, speech, UI and PWA lifecycle remain separate. See `docs/ARCHITECTURE.md`.

## GitHub Pages

The workflow runs source validation, 32 unit tests, a reproducible build, and real-origin Chromium tests before publishing `dist/`. Validation uses read-only repository permissions; only the separate deployment job has Pages/id-token write permissions.

In **repository Settings > Pages > Build and deployment**, choose **GitHub Actions**. Repository administration may be needed; the connected coding app may not have that permission. A source commit, passing validation and successful Pages deployment are separate facts. The intended project URL is `https://longunibim.github.io/rise-voca/`; do not treat this as verified live until deployment succeeds.

On Safari, Share > Add to Home Screen. On Android, use the browser's Install app/Add to Home screen command. Remain online until the app reports app/content and emoji/CSS offline readiness. Speech must be tested separately. Updates wait: Save & pause, close all Rise_Voca windows, reopen. Never clear site data as the normal update procedure.

## Adding a daily lesson

Edit only `data/library.json` and `data/illustrations.json`. Retain item/sense IDs, add the lesson's explicit target memberships, source metadata, date and `PK1_Theme_Lesson` name. Increment content version only for content changes. Do not delete a repeated target because it was assigned last week. Ambiguous material stays pending with a reason. See `docs/CONTENT_MAINTENANCE.md`.

Build generates five weekly packs, manifests, icons, fingerprints and offline file hashes from canonical sources. Do not hand-edit generated copies. Original image/source rights remain separate from code ownership. Keep source scans, private backups, credentials and learner names out of this public repository.

## Tests and physical acceptance

```sh
python -m pip install playwright==1.57.0
python -m playwright install chromium
python tests/browser.py --report test-results/browser.json
```

A preinstalled Chromium can be selected with `CHROMIUM_PATH`. The browser suite uses temporary profiles and synthetic English voices. It tests actual IndexedDB, transactions, two-tab behavior, backup/restore, service workers and offline browser reopening; it does not establish audible playback or mobile OS installation.

Physical acceptance: install and reopen on iPad/iPhone and Android; verify actual voice list and delayed refresh; select a downloaded English voice; test while offline; confirm rate changes, pause/resume after force-closing, 4-choice touch targets, portrait/landscape, and backup download/restore. Do not use real learner data for destructive browser tests.
