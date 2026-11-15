# Verification report — NhaiKanji

The app is implemented in `/home/duy/nhaikanji`. The source reference was inspected directly at `https://kitsumi.app/vi` and the public app routes. This report distinguishes implemented and tested behavior from remaining differences; it does not claim pixel-identical or production-service parity.

## Verified implementation

- Next.js 15.5.29 production build completed, including TypeScript checking, page generation and build traces.
- `npm test` includes 39 passing tests (one opt-in browser test is skipped by default and was run separately): gamification/auth/API validation, kana/romaji grading, keyboard behavior, lesson data, SRS, score logic and local social persistence.
- `npm run typecheck` and `git diff --check` passed.
- `npm audit` reports zero vulnerabilities, including development dependencies, after pinned dependency overrides and Lighthouse update.
- All 23 public/application routes returned HTTP 200, with no page/console errors, missing translation keys, broken images or horizontal document overflow at desktop and 390px.
- Landing and dashboard: light/dark, sidebar collapse persistence, dictionary shortcut/search, mobile sheet and menu tested.
- Lessons: 30 lesson cards, actual category and level filters/search/empty states, local native audio, per-word reveal penalties, wrong/correct answers, kana/full-width romaji normalization, sentence progression and completion, notes, keyboard transport, recording and recording playback all passed browser assertions.
- Lesson integration: 24 passing checks, 90/90 MP3s fetched and decoded in Chromium; vi/en/ja lesson routes checked at 320/390/768/1024/1440px; furigana, translation, transcript, artwork, continuous audio, recording A/B pause behavior, shadowing mission and persisted local comments verified. No external write requests during this suite.
- Study: 14 passing browser cases, all 10 games completed with persisted actual scores and replay, 42 layout checks, no page or console errors. Covers vocabulary deck/card CRUD, all four SRS grades, grammar notes/review, all five exam levels, resuming answers, history, and timer auto-submit exactly once.
- Social: 8 passing browser flows, covering purchase/equip with balance persistence, one-time mission claims, profile/privacy, note CRUD/search, personal vocabulary integration, local community post/like/comment, feedback persistence and mobile dark layout.
- PostgreSQL 16.15 ran as the existing unprivileged user, loopback only (`127.0.0.1:5434`), with files under project `.local/`. No Docker service, root user or system configuration was required.
- Main database migration and seed ran twice with read-back verification. Test database integration passed 15 checks, including concurrent debits/claims, receipt idempotency, no overdraft, incorrect/repeated sentence rewards, database reads, session expiry/revocation, cross-origin/input rejection, and session-derived ownership. Generated test users were removed and fixture counts read back.

## Seed counts read back from PostgreSQL

| Entity | Verified count |
| --- | ---: |
| Demo user + ranking users | 1 + 20 |
| Categories | 5 |
| Lessons | 30 |
| Sentences | 90 |
| Words | 704 |
| Shop items | 10 |
| Milestones | 10 |
| Missions | 4 |
| Grammar points | 20 |
| Exams / questions | 5 / 25 |

## Visual comparison

Measured at 1440×1000; measurements are in `visual-comparison.json`.

- Desktop sidebar width: 256px; collapsed 64px; header height: 64px.
- Dashboard heading x272/y88, 28px/36px matches source.
- Sidebar navigation corrected to 48px rows.
- Reference streak card: y176/h190; clone before the final minor accessibility-only changes: y176/h190.
- Reference quick review: y390/h124; clone: y390/h124.
- Reference activity card: y831.75/h392.73; clone: y832.12/h386. The activity-card start differs by 0.37px; its internal height still differs. This is documented, not treated as exact parity.
- Lesson cards measured 260px wide, 231.125px high, 84px body, 40px two-line title area.
- Dashboard leaderboard follows the prompt's full list of 20 with a pinned learner row; podium is on the dedicated leaderboard page.

Reference and clone use different source content and auth state. Accordingly no numeric pixel-similarity score is asserted. Screenshots are saved for human inspection; automated image interpretation was unavailable (provider returned 403), so verification used DOM/computed styles, screenshots and browser interactions.

## Lighthouse

See `lighthouse-summary.json` for the most recent measured values and `lighthouse-home-*.json` for raw reports. Both performance and accessibility exceeded the requested 90 threshold on the tested production `/vi/home` page. Scores are measurements on this machine and may vary.

The source coral token and small GitHub-style heatmap cells produce contrast and target-size findings. The report preserves these limitations instead of claiming full WCAG conformance. Visible-label/accessible-name mismatches were reduced in the shared header and lesson links; the raw audit still flags some composite labels. Latest scores are recorded in `lighthouse-summary.json`; they exceed the requested90 threshold in the tested production runs.

## Remaining differences / unverified production integration

- Original NhaiKanji name/logo/bear mascot, artwork and learning text are intentional per the provided prompt. No Kitsumi proprietary artwork, lesson audio/transcript, user data or testimonial was copied.
- Browser persistence and explicit private account save/restore are implemented. This is manual backup, not automatic sync or trusted XP/reward synchronization. Account Settings uses optimistic version checks and user confirmation; demo data is never uploaded automatically.
- Google OAuth, SMTP delivery and real email magic links remain unconfigured and untested. No external email was sent. Test sessions were generated only for the isolated test database.
- The 30 shipped lessons remain audio-only with original local synthesized speech. The player now supports authored YouTube sources with explicit sentence clips, loop, playback rate, volume and local-audio fallback. The actual public IFrame API diagnostic passed; no licensed video lesson was added to the seed.
- Recording stores real browser audio locally, but no automatic pronunciation scoring is implemented. Automated tests use Chromium's fake audio input, not a user's microphone.
- JLPT practice exams have five authored questions each, not full official exam papers. Games use implemented browser mechanics; no real multiplayer or 3D engine.
- EN/JA are scaffolds in some sections and include fallback copy. VI is the primary UI.
- A full offline PWA/service-worker cache is not implemented. Lesson audio/assets are local once the local server is running.
- No public deployment was performed. Source changes are grouped into module commits for the requested main-branch push. Existing user-prepared deletions in Git were not reverted.

## Evidence and rerun commands

```sh
npm test
npm run typecheck
npm audit
npm run build
npm start
npm run qa:routes
npm run qa:lessons
npm run qa:study
npm run qa:social
```

Database, in another terminal:

```sh
npm run db:local
npm run db:setup
npm run db:test
```

- `verification-summary.json`: programmatic aggregation of actual results.
- `routes.json`, `landing.json`, `dashboard.json`, `social-flows.json`.
- `lessons-integration.json` and `../src/features/lessons/qa/report.json`.
- `../src/features/study/qa/report.json`.
- `backend-verification.json`.
- `npm-audit-final.json`, `lighthouse-summary.json` and raw Lighthouse reports.
- `screenshots/`: desktop/mobile/light/dark evidence.

## Independent review corrections

The independent reviewer found five concrete local UI/store integration defects. All were reproduced and fixed, with regression evidence in `tests/local-progress.test.ts` and `qa/review-regressions.json`:

1. Listening/speaking completion and bonuses now use distinct mode-qualified identifiers. The profile and lesson cards consume those identifiers.
2. The profile's active-lesson filter matches the player's mode-qualified identifier.
3. Browser-local check-in calls the shared calendar-aware streak function; protected missed dates count consistently and consume the correct freezes.
4. Personal weekly/monthly rankings sum only dated XP, minutes and completions in the selected interval. Earned mission XP now enters the daily record. Legacy completions without a reliable date remain in lifetime totals only.
5. Only streak milestones display freeze-card rewards; level milestones no longer promise rewards they do not grant.

The focused browser suite failed all four cases on the previous production build and passed all four on the corrected build. Five new store/period regression tests pass; the complete unit suite is now28/28. Production build, typecheck, player browser flow, and eight social flows passed again. Legacy completion strings remain stored; unknown old modes/dates are not guessed or rewritten.

Independent re-review confirmed all five fixes, with no remaining findings in that scoped review. Evidence: `independent-review.json`. Final server read-back returned healthy demo mode; TypeScript and whitespace checks passed.

## YouTube and account additions

- `qa/youtube.json`: five browser adapter/fallback checks and actual public YouTube API/embed diagnostic. The opt-in suite passes9/9. Official example ID is diagnostic-only. Clips cue without autoplay, end within bounds and replay correctly. `tests/lesson-seed.test.ts` proves video IDs and absolute clips survive database seed mapping.
- `qa/account-sync.json`: ten real database-session/API/browser checks, including account isolation, stale versions, malformed/oversized bodies, explicit import, cross-device restore, failed-network truthfulness, component remount, logout and expired sessions.
- `qa/account-app.json`: seven checks on the actual Next production Settings route, including PostgreSQL read-back, locale navigation, account-isolated player notes, logout and390px layout.
- Private progress migration applied to the main local database and both setup/seed and read-back passed. There was no external deployment or real OAuth/SMTP operation.
- Snapshot restore does not update authoritative rewards, inventory or public rankings. Lesson-specific notes/comments are isolated by account but remain device-local; recordings remain ephemeral.
- `qa/grammar-deeplink.json` passes for the landing page's JLPT N1 link and switching tabs.


## Account focus regression correction

The targeted independent review identified a P1: authenticated focus/visibility refresh unmounted the whole app and discarded active lesson work. The actual production-player test reproduced the disconnected dictation textarea on the previous build. The boundary now preserves mounted children during routine refresh and network failures; its keyed child tree still resets on verified account changes. Backup actions recheck session ownership before mutation.

The account harness now passes12/12, including delayed focus, visibility and network-failure preservation. The full production-app suite passes9/9 and confirms the real dictation input, unsaved note and recorded audio blob remain connected and usable. Existing account isolation and logout tests still pass. Evidence: `account-focus-regression.json`, `account-sync.json`, `account-app.json`. These are parent-verified fixes following the independent finding; no claim of a second independent review is made.

The test server now selects a free loopback port and waits for its child process to stop, preventing stale-server interference. Production build,39 default unit tests (plus the separately executed opt-in YouTube test),23 route checks and4 earlier review browser regressions pass.
