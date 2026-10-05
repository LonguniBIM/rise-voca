# Architecture and invariants

## Modules

- `src/core.js`: pure state transitions, sampling, exact choice-ID scoring, reports, validation and atomic-merge plan. No DOM/network/storage imports.
- `src/store.js`: IndexedDB v1 (`rise-voca-v1`), transaction-completion barrier, optimistic session revision check, serialized writes and a database-wide 15-second writer lease renewed every 5 seconds.
- `src/speech.js`: injected device TTS adapter and deterministic voice selection. No learning-history dependency. Browser timer defaults are bound through wrappers to avoid illegal Web API invocation.
- `src/app.js`: safe DOM presentation, explicit user actions, review controls and PWA status. Quiz Listen records a requested playback; parent Test voice never calls the learning-domain event functions.
- `scripts/build.mjs`: dependency-free static build, canonical JSON fingerprints, Monday-Sunday pack generation, original geometric PNG icons, SHA-256 offline dependencies.
- `public/sw.js`: scoped, bounded-concurrency precache installation; all workers settle before failed cache cleanup. Activation removes only this app's obsolete caches and never touches IndexedDB. No forced `skipWaiting()`.

## Content model

A learning item represents a meaning/form. A lesson owns a target membership, not the item globally. Full lessons include every ready membership and are blocked if even one assigned target is unresolved. Review can sample the union without updating lesson completion. Letter targets retain case. Correct options use explicit IDs rather than answer-string normalization.

Question snapshots retain source context, answer alternatives and their shuffled order. Completed history is interpreted from its snapshot even when a live item is later retired. The original standalone HTML had no persisted history to migrate. This app does not read or alter the unrelated Flyers database.

## Fingerprints and illustration identity

The library fingerprint covers all canonical content. The registry fingerprint covers its records and recipe identities. Each recipe identity covers item ID, kind, visual, sparks and `styleVersion`; bump the latter whenever the drawing semantics or CSS recipe changes. It is not a hash of device-rendered font pixels. The app version is a separate reproducible hash of build input paths and bytes. Image-only changes do not change the content fingerprint.

`retained-reference` means a supplied cue has been preserved, not that the parent clicked Approve. New candidates start `needs-review`. A device decision applies to item plus recipe identity. Changing a candidate requires fresh review. No stale rejected recipe is silently replaced by a generic topic picture. New context clues remain answerable with the picture hidden; letter-form question content is always visible.

## Scoring and timing

A submitted wrong answer counts once; ordinary browsing, test speech and image decisions never count. Correct feedback locks that question and fixes first-correct time, attempt number and support counts. First-attempt stars include hinted first attempts; the separately reported unassisted metric excludes hints/written-clue supports. The ordinary on-screen question is part of the activity, not a separately requested transcript. Listening requests do not prove hearing or understanding.

A four-question round break does not mark the next question seen until Continue. Backgrounding pauses the session. Estimated active time accrues only on the visible quiz, excluding pauses, breaks and idle periods over 60 seconds, with bounded increments and no negative durations. Device-clock changes can affect elapsed chronology; no verified-server precision is claimed.

## Persistence and restore

Every learning write waits for transaction completion. A lost lease or revision conflict stops writes rather than replacing a newer session. Read-only tabs may export and test voices, but cannot score, change settings or approve images. Write failures hold the in-memory candidate for an explicit backup.

History backup validates JSON size/depth, IDs, schemas, timestamps, allowed states, four options, observed answer evidence and first-correct integrity. Current library membership is not required for old immutable snapshots. Identical sessions are ignored; conflicting same-ID sessions abort the entire merge transaction. Device image reviews/preferences have separate exports and are not silently imported as learning data. No destructive reset/migration is used in v1.

## Source preservation matrix

| Supplied behavior | Evidence | Preservation/test |
|---|---|---|
| Four options, numbered keys | Original HTML answer renderer | Choice-ID validation; browser Numpad suppression and 4 controls |
| Original seven prompts/options | `const quiz` in supplied HTML | Exact fixture comparison in `scripts/validate.mjs` |
| Retry without duplicate success | Original `handleAnswer` | Two wrong + one correct = three attempts; repeated events ignored |
| Hint and first-try stars | Original hint/score state | Hint tracked separately; unassisted metric tested |
| Listen and positive model-word playback | Original `listenToQuestion` / `speak` | User-triggered TTS adapter; synthetic voice tests; physical audio pending |
| Short break after four | Original `ROUND_BREAK_AFTER` | Generic four-question round state and resume |
| Summary and replay | Original finish/summary | Snapshot-based parent report, browser finish/replay entry |
| Emoji + CSS scene | Original scene styles | Seven retained mappings; reviewable new cues; no font files |

## Privacy and limitations

No accounts, tracking, microphone or background notifications. Speech synthesis may use a browser/OS remote voice: the requested clue/test text may therefore be processed by that service. The app does not send learning histories or learner names to it. Prefer a local voice and test offline. A public static site exposes its code, questions and answers. Hosting/CDN request logs are controlled by the host, not an app analytics feature.
