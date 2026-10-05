# Rise_Voca delivery status - 2026-10-05

## Release status: LOCAL PRE-RELEASE, NOT PUBLISHED

The application source and a deterministic static build are included in this package. They have not been committed to the repository's main branch or deployed to GitHub Pages. Real-origin integration and physical-device acceptance are not complete.

| Item | Confirmed status |
|---|---|
| Authorized repository | LonguniBIM/rise-voca |
| Remote main HEAD | 6ed173c9b0508223e72df0ef635754fe414244e1 |
| Main commit contents | AGENTS.md initialization only |
| Local application version | 1.0.0-7022e012bcfa |
| Local content version | 2026.10.05.1 |
| Library fingerprint | 78e5b7e77957078da7a316800c57dedc07e008fa0a7dc6dca03221c2e05f7d22 |
| Application commit SHA | None; publication blocked |
| GitHub Actions execution | Not run; workflow remains in local package |
| GitHub Pages deployment | Not performed; no live URL verified |

## What is implemented locally

A modular standard-JavaScript PWA with canonical JSON data, generated weekly packs, four-choice age-five quizzes, independently scoped daily coverage, small rounds, hints, retries, first-attempt stars, first-correct evidence, pause/resume/replay, report filters, CSV, JSON backup/restore, an illustration review gallery, scoped cache lifecycle and English device-voice controls.

Speech implements Auto/en-GB/en-US/en-AU/en-CA/en-IE/en-NZ, dynamically exposed English device voices, 0.75/0.9/1.0 speeds, Test voice and Refresh voices. Saved URI/name/language preferences are retained when unavailable. Refresh occurs at startup, after delayed retries, voiceschanged, foreground/page resume and manual request. Test voice has no dependency on the learning-history writer. No microphone or pronunciation assessment exists.

The initial Vite/TypeScript proposal was changed to standard ES modules plus a dependency-free deterministic Node build. This preserves the original HTML workflow without an npm/runtime framework dependency. It is a documented architecture choice, not a claim that a Vite build was executed.

## Tests actually performed

| Check | Result | Scope |
|---|---|---|
| JavaScript syntax | PASS | app/store and Node-imported domain/speech/build/test files |
| Library/source validation | PASS | IDs/references, four unique options, correct choice, original seven questions preserved |
| Unit tests | 32/32 PASS | Domain transitions, repeats, case-sensitive letters, scoring, sampling, source gates, reports, backup validation, speech fallback/lifecycle |
| Deterministic static build | PASS | build and byte-for-byte --check |
| DOM smoke tests | 13/13 PASS | Chromium DOM, synthetic speech/fetch/UUID, explicitly temporary-memory storage |
| Responsive checks | PASS within DOM suite | 360, 390, 768, 1024 widths; quiz touch targets >=44px; home/review/history/settings/gallery without horizontal overflow |
| Real IndexedDB transactions and reload | NOT RUN | Real-origin browser navigation blocked by environment policy |
| Real service worker/offline reopening | NOT RUN | Same environment limitation; integration suite is included but not executed |
| CI / deployed-site smoke | NOT RUN | Application publication blocked before workflow reached main |
| Physical iPad/iPhone/Android | NOT RUN | Actual installed voices, audible offline playback and home-screen installation still require devices |

DOM smoke tests executed the application's real rendering and event logic with test-only dependency fixtures on about:blank. Their successful temporary-memory flow must not be interpreted as evidence that IndexedDB or a service worker works. Screenshots contain synthetic sessions/voices and a temporary-memory warning; they are not real learner history or screenshots of a live deployment.

The full real-origin integration suite is `tests/browser.py`; its existence is not a passing result. It covers actual storage, backup merging, two-tab writing, service-worker installation, offline process reopening, mobile layout and failure of a required offline download. Those tests must pass before release.

## Content coverage

8 lessons; 5 weekly packs; 2 themes; 61 item records; 58 ready questions; 3 unresolved source records; 79 lesson memberships. Six lessons are available in full and two are explicitly partial-review only.

Weather Report Lesson 2: confirm whether `Turning green Bloom` should be split and what the intended terms are. Lesson 3: confirm the intended senses of `light` and `heavy`. A source ambiguity is not silently omitted to label a lesson complete. ABC A/a through D/d is expanded into eight distinct letter-form targets.

Seven supplied emoji mappings are retained. Forty new candidates await parent review. Eight letter-form cards are non-pictorial. Six records have no attached suitable illustration: customer, white oak, milkweed, Turning green Bloom, light and heavy. There are no externally downloaded images or bundled font files. New context questions remain answerable with an unapproved picture hidden.

## GitHub write block

An initial GitHub app write created AGENTS.md successfully. A first Git tree object containing speech.js, sw.js, index.html and basic package metadata was accepted, but was not committed or applied to main.

The subsequent `GitHub.create_tree` operation targeting `src/store.js` and `src/core.js` was blocked with this exact response:

> This tool call was blocked by OpenAI because we couldn't determine the safety status of the request.

Repository: LonguniBIM/rise-voca. Base tree in that call: 69f5865aedc76054eace61e0a8eb916e221af73f. No retry, re-encoding, alternate write connector, branch-ref update or deployment was attempted after the block. A read-only branch check confirmed main remains at the initialization commit above.

This message does not supply a root cause, a triggering rule, or a GitHub permission error. It is not evidence that the application was deployed or that its code was judged unsafe. The local candidate hashes below identify the files, not a recovered serialization/hash of the complete blocked tool-call payload.

| Local file in blocked operation | Bytes | SHA-256 |
|---|---:|---|
| src/core.js | 20027 | 4ddea0470e5dfedd0c9e048d4821faa9656d612d1c20d5b049a12441de3e9c77 |
| src/store.js | 5445 | 0bad61ec29b17e378c0dbb844beccbd9329b35bb96dea1cbcc26d4849d1cbe00 |

## Remaining release gates

Resolve the connector publication block without treating it as an ordinary GitHub permission problem. Reconcile with the actual main HEAD before any subsequently authorized publication. Run the real-origin browser suite and review its evidence. Configure/verify GitHub Pages separately if repository administration is required. Verify the deployed build version. Complete physical iPad/iPhone/Android checks. Resolve the three content ambiguities before enabling the remaining full lessons.

The current backup importer accepts full JSON up to 8 MiB and 10,000 sessions. These are defensive import bounds, not an automatic retention/deletion policy. Keep periodic backups outside the app; review/export-scale requirements before histories approach these bounds. Voice preferences and picture reviews are separate exports and are not restored by the history importer.

Do not clear site data as an update or voice-refresh step. Do not import actual learner backups into test profiles. Do not report CI, offline, audible speech or installation as passed until the corresponding checks are actually run.
