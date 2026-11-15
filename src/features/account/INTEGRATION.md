> Integrated: locale boundary, static message namespaces and Settings card are now wired in the application. Main local database migration applied and verified; full Next production Settings QA is in `qa/account-app.json`.

# Account backup integration

Exports from `@/features/account`:

- `AccountBoundary`: wrap the full app once, inside `NextIntlClientProvider`, outside components that use the three persisted stores. It checks identity before initially rendering authenticated data, scopes local storage, cancels pending requests on account changes, and restores the original anonymous store on logout. Routine focus/visibility checks and temporary request failures preserve mounted lesson work; only verified identity changes reset the child tree. Do not mount only on Settings: it must remain alive while navigating.
- `AccountSettings`: place in the Settings card column inside that boundary. It renders nothing if authentication is unconfigured.

Merge the static JSON namespaces in `src/i18n/messages.ts`:

```ts
import accountvi from '@/messages/account.vi.json';
import accounten from '@/messages/account.en.json';
import accountja from '@/messages/account.ja.json';
// Add account: accountvi / accounten / accountja to the matching locale object.
```

Example provider integration:

```tsx
import {AccountBoundary} from '@/features/account';
<NextIntlClientProvider messages={messages} locale={locale}>
  <AccountBoundary>{children}</AccountBoundary>
</NextIntlClientProvider>
```

Example Settings integration:

```tsx
import {AccountSettings} from '@/features/account';
// Inside Settings JSX:
<AccountSettings />
```

Deploy the new Prisma migration and regenerate the client using the existing project deployment workflow. The parent has additionally applied this migration to the project-local `nhaikanji` database and completed the production build. No external deployment was performed.

## Behavior

This is an explicit manual private backup, with Save, Restore, and a separate confirmed import of anonymous browser/demo data. It never automatically uploads or restores data. A fresh account starts empty; it cannot silently inherit the browser's anonymous history or another account's data. The original anonymous data remains under the original three persistence keys. Account-specific data uses separate keys; the last acknowledged server version is persisted independently so reloads cannot bypass optimistic locking.

`GET /api/progress` returns `{userId, snapshot: null | {version, data, updatedAt}}`. `PUT` requires a valid session, same-origin request, `X-Progress-Owner` equal to the authenticated id (binds confirmation to identity), and JSON `{version, data}`. Initial version is zero. Unknown fields, unsafe prototype keys, invalid structures and payloads over 1 MiB are rejected. Conflicts return 409 and require Restore or an explicit Keep local confirmation.

Local progress/XP and local community drafts are private JSON backup contents only. No User reward, inventory, public profile, post, ranking or study-event tables are updated. This does not implement automatic sync or verified XP synchronization.

## Verification

```sh
node --import tsx --test tests/account-*.test.ts
node --import tsx tests/account-database.ts
node --import tsx tests/account-integration.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

The integration runner uses the project-local Postgres helper, a dedicated database, actual Auth.js database sessions and route handlers, and two isolated Chromium contexts. It bundles the real component with esbuild and hosts a loopback HTTP bridge with Next request/work AsyncLocalStorage; it does not invoke a Next build/dev server or change tsconfig. The bridge must preserve separate Set-Cookie headers. Test credentials are random and short-lived; no OAuth callback or email is sent. Test users are deleted after execution. The installed `/usr/bin/google-chrome` is used because the Playwright-managed browser is absent.

`qa/account-sync.json` contains the actual test result. Parent integration should still smoke-test the full Settings route after mounting the boundary and merging messages.
