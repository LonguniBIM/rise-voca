# Rise_Voca repository instructions

- Discuss work with the parent in Vietnamese. Write comments, documentation and commits in English.
- Audience: age five. Preserve four-choice quizzes, gentle retries, hints, Listen, first-attempt stars and exactly-once first-correct evidence.
- Use Unicode emoji and original CSS first. Never attach inaccurate images to claim coverage. Do not redistribute font files or source scans.
- Every full lesson includes every core/key target assigned to that lesson, including repeats from other days. Shared items never imply shared lesson completion.
- Names follow Class_Theme_Lesson, for example PK1_4 - Weather Report_6. Preserve source class PK1_2603 and stable IDs separately.
- The latest parent confirmation splits Turning green and Bloom into distinct items; the earlier combined decision is superseded. Earth means soil/ground, and Light rain / Heavy rain remain unchanged. Apply the versioned confirmations in docs/PARENT_CONFIRMATIONS.md; preserve old IDs and snapshots.
- Review lessons use explicit source-lesson unions, not guessed vocabulary. July 4 is Unit 2 Ant Disaster Lesson 5 / Number Song, while its historical ID remains stable. Never let an older, smaller solved session complete an expanded lesson.
- Canonical inputs are the base data/library.json and data/illustrations.json plus versioned data/lesson-packs/*.json. Build composed runtime catalogs and weekly packs deterministically; do not hand-edit or commit dist/.
- Keep all learner history local. Never publish private backups, learner names, device review exports or credentials.
- Voice settings use actual device voices, preserve unavailable preferences and handle delayed loading. Automatically read each clue defaults on, requests once per question, and never repeats on re-render. Test voice never creates learning evidence.
- Never reset IndexedDB or clear site data for an update. Preserve snapshots, attempts, first-correct evidence and legacy event compatibility. Cache cleanup affects only this app.
- Read existing source before changes and preserve unrelated work. Run tests and build; never force-push or change protections.
- Direct development on main through the GitHub app is authorized. LonguniBIM/voca-flyers is read-only reference, not a deployment target.
- Deploy only validated dist via .github/workflows/pages.yml. Pages Source must be GitHub Actions, not branch/Jekyll publishing.
- Run both tests/browser.py and tests/auto_browser.py for real-origin integration. Mock-only DOM tests never establish persistent storage or offline behavior.
- Do not claim physical-device installation or audible/offline speech from desktop or synthetic-voice tests.
