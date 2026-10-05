# Automatic English clue requests

The existing settings record gains a boolean `autoReadClue`, default true when absent. Existing explicit false, speed and device voice identity are preserved. No database version or namespace changes.

An automatic request is eligible only for a visible, unpaused, writable active quiz question. The controller guards session/question identity before submitting and writes one optional `trigger: automatic` Listen support event. Once this event exists, a re-render, retry, hint, speed change, voice refresh, reload or resume cannot request automatic playback again. An in-memory attempted set also prevents loops when submission fails synchronously. Manual Listen remains explicit and carries `trigger: manual`; old support records without a trigger remain valid and are displayed as manual requests.

Only the clue is read, never the correct answer or explanation before answering. The existing post-correct model-word pronunciation remains separate. Finishing, pausing, navigating and backgrounding cancel stale audio. Parent settings, Test voice and picture review do not create learning sessions or support events.

A successful call to speechSynthesis.speak only means playback was requested. An asynchronous not-allowed/device error is not evidence of audible playback; the UI directs the parent to Listen. The application does not silently retry forever or award listening/comprehension credit. First-correct snapshots include the number of requested listens, while first-attempt and needs-practice rules remain unchanged.

Tests cover default/false migration, deduplication, hidden/read-only/paused guards, blocked synchronous submission, old event compatibility, actual IndexedDB reload through Chromium, Test voice isolation and mobile layout. All speech voices in automated tests are synthetic fixtures. Physical Safari/iPhone/iPad and Android autoplay permission behavior, installation and audible offline speech require real-device acceptance.
