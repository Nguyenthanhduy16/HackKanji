# Backend setup and verification

The backend uses PostgreSQL, Prisma 6, Next.js route handlers, and Auth.js database sessions. The default UI remains a browser-persisted demo. Starting PostgreSQL or configuring authentication does **not** migrate browser-local progress, shop inventory, decks, or social content into an account. Settings now supports explicit private account save/restore through `/api/progress`. It does not automatically upload demo data, synchronize trusted rewards, or publish community content.

## Project-local PostgreSQL (no Docker or administrator access)

Run commands from the repository root with the existing unprivileged user. Install the locked dependencies with `npm ci` on a fresh checkout, then generate the client:

```sh
npm run db:generate
npx tsx prisma/local-postgres.ts
```

Keep the database command running in its terminal. It initializes the cluster only when `.local/postgres/PG_VERSION` is absent, starts PostgreSQL on **127.0.0.1:5434**, verifies that loopback is its only TCP listen address, and creates `nhaikanji` and `nhaikanji_test` if missing. Files, sockets, and temporary initialization files stay in `.local/`. The script refuses root and occupied port 5434; it never installs a service, creates a system user, kills another process, or drops a database. If the project database is already healthy, reuse it instead of starting a duplicate.

For local migration and seeding without copying the development URL, run `npm run db:setup` in another terminal. For manual configuration:

```sh
export DATABASE_URL='postgresql://nhaikanji:nhaikanji_dev_only@127.0.0.1:5434/nhaikanji'
npx prisma migrate deploy
npm run db:seed
npm run db:seed
```

The username/password above are intentionally public development credentials, used only by this loopback database. Never use them for a deployed database. The helper `localDatabaseUrl()` in `prisma/local-postgres.ts` supplies the same connection string programmatically. Use `127.0.0.1`, not `localhost`, to avoid an IPv6 listener mismatch.

`migrate deploy` applies the initial schema and `20261115000200_private_progress`, adding a private snapshot owned by each user. The seed performs a serializable transaction and reads back the exact seeded IDs before reporting success. The second run is safe: reserved `nhai_seed_` IDs are upserted, authored catalog data is refreshed, existing user balances/progress are retained, and unrelated users are not removed. The `.invalid` seed mailboxes are fixtures, not sign-in credentials.

Start a loopback-only application server with the same exported `DATABASE_URL`:

```sh
npx next dev --turbopack -H 127.0.0.1 -p 3000
```

Verify the live server:

```sh
curl --fail http://127.0.0.1:3000/api/health
curl --fail http://127.0.0.1:3000/api/lessons
curl --fail http://127.0.0.1:3000/api/auth-status
```

With a database but no authentication provider, health returns `mode: "database"`, `database: "ready"`, and `authConfigured: false`. Public catalog routes work. Private routes return `503 auth_not_configured`. With no `DATABASE_URL`, the catalog routes explicitly return `mode: "demo"` and private writes remain unavailable.

Stop the database with Ctrl-C in its original terminal. On the verified Linux x64 installation, an orphaned project cluster can be stopped gracefully with:

```sh
node_modules/@embedded-postgres/linux-x64/native/bin/pg_ctl -D "$PWD/.local/postgres" -m fast -w stop
```

This preserves the data directory. Do not remove `.local/postgres` to stop the database. `compose.yaml` is an alternative Docker configuration using the same loopback port; do not run both database methods at once. The integration runner below expects the project-local script's `nhaikanji_test` database.

## Seeded data

Exact main-database counts verified after two seed runs:

| Entity | Count |
| --- | ---: |
| Demo account | 1 |
| Ranking learners | 20 |
| Categories | 5 |
| Lessons | 30 |
| Sentences | 90 |
| Words | 704 |
| Shop items | 10 |
| Milestones | 10 |
| Daily missions | 4 |
| Grammar points | 20 |
| Exams | 5 |
| Questions | 25 |

Ranking fixture study days use the deterministic seed date `2026-11-15`. As time advances, week/month rankings can exclude those rows; `period=allTime` continues to show them. New users' study-day boundaries use their stored timezone; leaderboard date windows use UTC.

## Authentication setup

Use private local environment configuration or deployment secrets. Next.js reads `.env.local`; Prisma CLI/seed commands need `DATABASE_URL` exported in their shell or provided by their environment. Do not commit private credentials.

Required configuration:

- `DATABASE_URL`: the migrated PostgreSQL database.
- `AUTH_SECRET`: a generated secret of at least 32 characters, not the placeholder in `.env.example`. Generate a real value locally with `openssl rand -base64 32`.
- `AUTH_URL`: the exact application origin, for example `http://127.0.0.1:3000`. Browser requests must use that origin.
- Google: both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`; register `/api/auth/callback/google` on that exact origin with Google.
- Email alternative: both `AUTH_EMAIL_SERVER` (SMTP URL) and `AUTH_EMAIL_FROM`; an actual mail service is required for delivery.

At least one fully configured provider is required before the Prisma adapter is enabled. Sign-in is exposed through `/api/auth/*`; `/api/auth-status` lists only public provider names and configuration availability. No credentials provider or demo-account sign-in bypass exists. Auth.js stores opaque session tokens in PostgreSQL, looks up their user for each private request, and derives ownership from that session. Expired, missing, invalid, and deleted sessions are rejected. OAuth account linking by matching email is disabled.

**Verification boundary:** real PostgreSQL sessions and protected HTTP handlers were tested using randomly generated, short-lived test-only session rows. Google configuration in that isolated server is deliberately nonfunctional, and no OAuth callback, Google authorization, SMTP delivery, magic-link flow, or external account was exercised. Real provider sign-in remains an operator setup/verification step. No user credentials are needed for the integration suite.

## API surface

All JSON responses use `Cache-Control: no-store`. API errors use `{ "error": { "code", "message" } }` without database URLs, tokens, stack traces, or SQL.

| Method / route | Behavior |
| --- | --- |
| `GET /api/health` | Database readiness and explicit demo/database mode |
| `GET /api/auth-status` | Provider availability; `demoPersistence: "browser-only"` |
| `GET /api/lessons` | Filters `level`, `category`, `q`; `offset=0..10000`, `limit=1..100` |
| `GET /api/lessons/:id` | Published lesson and sentence/word data |
| `GET /api/shop` | Active shop catalog |
| `GET /api/grammar` | Grammar catalog; optional `level`, `q` |
| `GET /api/exams` | Exam metadata and question counts; no answer key |
| `GET /api/leaderboard` | `period=week|month|allTime`, `metric=xp|minutes|lessons`; up to 20 public users |
| `GET/PUT /api/progress` | Private manual backup; authenticated owner, version conflict check, 1 MiB limit |
| `GET /api/me` | Authenticated profile; excludes email and provider credentials |
| `GET /api/dashboard` | Authenticated profile, study days, missions, milestones, inventory, progress |
| `POST /api/checkin` | Once-per-local-day check-in reward |
| `POST /api/missions/:id/claim` | Claim today's completed mission once |
| `POST /api/milestones/:id/claim` | Claim an eligible milestone once |
| `POST /api/shop/purchase` | JSON `{itemId, requestId}`; idempotent purchase receipt |
| `POST /api/shop/equip` | JSON `{itemId}`; only owned cosmetics may be equipped |
| `POST /api/study/sentence` | JSON `{lessonId, sentenceIndex, answer, durationSec}`; server-checked answer and reward |

Private writes require a valid session and an `Origin` matching `AUTH_URL` (or the request origin if unset); cross-site fetches are rejected. JSON body routes require `application/json`, reject unknown fields, and cap transactional input at 32 KiB (`/api/progress` has its own 1 MiB stream limit). `requestId` must contain 8–100 ASCII letters, digits, `_`, or `-`. Client-supplied user IDs or balances are not accepted. Retry purchases with the same `requestId`; reusing it for another item fails.

Reward and purchase operations use serializable transactions with bounded retries for serialization/unique conflicts. Unique receipts plus conditional debits prevent repeated rewards, duplicate cosmetics, negative balances, and freeze-card overflow. Sentence rewards use natural receipt keys rather than client-generated request IDs. Incorrect answers give no XP; completing all sentences awards a single lesson bonus and attempt. Study time credited to a sentence is capped from its authored duration. These checks establish consistency and replay protection, not proof of human effort or a complete anti-cheating system.

The schema also contains decks, reviews, grammar progress, exam attempts, social posts, notes, and vocabulary for future server integration. Tables alone do not make those browser-demo features synchronized; this document lists the implemented route surface.

## Repeatable verification

With the project database running:

```sh
npm test
npm run typecheck
npx tsx tests/backend-integration.ts
```

The integration command always targets **127.0.0.1:5434/nhaikanji_test** through `localDatabaseUrl("nhaikanji_test")`; it does not use a caller-supplied remote database URL. Keep that database dedicated to verification. It applies the migration, seeds twice, tests seeded state preservation, creates uniquely named private fixture users, and removes only its own test users (with cascading receipts/sessions) at completion. It confirms cleanup and restores the exact fixture totals.

The runner starts its own HTTP server on **127.0.0.1:3107**, refuses an occupied port, and uses `.local/backend-next` as its Next.js output directory. This avoids overwriting the app's `.next`/production output or requiring the demo app on port 3000 to change configuration. It strips provider environment variables, supplies an ephemeral random auth secret and nonfunctional test provider configuration, and explicitly disables email configuration. Generated session tokens are not printed, written to a browser, or kept in a fixture file. The HTTP server is stopped after the checks; PostgreSQL is left running.

`npx tsx tests/backend-integration.ts --skip-api` runs only database/transaction checks. The normal `npm test` suite does not implicitly require PostgreSQL.

Evidence is written to ignored local artifacts:

- `.local/backend-verification.json`: pass/fail, each check, exact counts, cleanup, and explicit `oauthTested: false` / `externalEmailSent: false`.
- `.local/backend-api.log`: actual Next.js HTTP request statuses for the isolated server.

The full run verifies seed counts/idempotency, a single debit for concurrent identical purchase requests, no overdraft, cosmetic uniqueness and equip persistence, freeze cap, concurrent check-ins/mission/milestone claims, wrong/repeated/completed sentence rewards, public database reads, session authentication/expiry/revocation, private-profile filtering, input/origin/ownership rejection, and concurrent authenticated purchase/claim routes.

Prisma 6 currently prints a nonblocking deprecation warning for `package.json#prisma`; migrate that configuration before upgrading to Prisma 7. No Prisma major upgrade is required for this setup.

## Private account snapshots

`AccountBoundary` is mounted inside the locale provider and above all app store consumers. An unconfigured deployment bypasses account requests. Configured accounts use isolated browser keys; importing demo data requires explicit confirmation. Save/restore are manual; version conflicts require a fresh choice. Snapshot contents never update authoritative XP, currency, inventory or public rankings.

`AccountSettings` is integrated into `/[locale]/settings`. The three store snapshots include decks, review scheduling, grammar notes, exam/game results, profile preferences, personal notes and local social drafts. Player-specific local notes/comments are account-isolated but are not part of the snapshot, and audio recordings are ephemeral.

Verification: `npm run qa:account` runs database concurrency tests, an actual Auth.js/route/component harness and a full production Next Settings/player test on a free loopback port. The production test includes locale navigation, restoring/saving/read-back, cross-account player-note isolation and logout. Temporary users/sessions are deleted. No real OAuth or email is invoked. Run `npm run build` first for the full-app test.
