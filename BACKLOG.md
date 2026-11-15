# Stonehill Church Backlog

The single living engineering backlog. It replaces `TASKS.md` (security review of 2026-08-25) and the earlier architecture-review backlog; open items from both are carried over here. Priorities reflect risk, not implementation order. When a change touches an affected area, address the item in the same change when practical, or leave it here explicitly.

Last reviewed: 2026-11-14.

## Needs owner action (not code)

### OPS-003 — Require CI before merging to `main`

- **Status:** Open
- **Why:** `.github/workflows/ci.yml` runs on every PR and push, but GitHub only blocks merges when branch protection requires it.
- **How:** GitHub → Settings → Branches → protect `main` → require the "Lint, typecheck, test, build" check.

### OPS-004 — Optional: backfill announcement fields

- **Status:** Optional
- **How:** `npm run migrate:announcement-channels` (dry run), then `-- --apply`. Not required: legacy documents are normalized at read time.

### OPS-005 — Switch App Check on forms to enforce mode

- **Status:** Open — after about a week of monitoring
- **Why:** `POST /api/forms` now verifies App Check tokens but runs in monitor mode (logs, never blocks) so a misconfiguration cannot stop real visitors.
- **How:** Check Vercel function logs for `[appCheck] forms:` warnings. When real submissions are consistently verified, set `APPCHECK_FORMS_MODE=enforce` in Vercel production and redeploy. See README → App Check on Public Forms.

## P1 — Security and abuse prevention

### SEC-005 — Enforce (or remove) the `critical` settings permission

- **Status:** Open
- **Evidence:** `lib/data/adminCms.ts` maps every settings action to `settings:manage`; `settings:critical:manage` exists in `lib/permissions.ts` and `firestore.rules` but the Admin SDK path never checks it.
- **Resolution:** Wire a real `critical` flag through the settings schema and gate it, or remove the permission and rule clause.

### SEC-007 — Invite tokens in URL query strings

- **Status:** Open (low impact)
- **Evidence:** `lib/data/userInvites.ts` builds `?token=...` links, so tokens can land in history, referrers and logs. Tokens are hashed at rest, single-use, and lookup/accept are now rate limited.
- **Resolution:** Move to a one-time redemption step (POST the token, then drop it from the URL), or document the exposure window.

### SEC-008 — Public-site CSP still allows inline scripts

- **Status:** Open (accepted trade-off)
- **Evidence:** The admin console uses a per-request nonce; the public site keeps `'unsafe-inline'` in `script-src` to preserve ISR caching. Public HTML sinks are sanitized server-side with DOMPurify, which is the primary defense.
- **Resolution:** Revisit with hashed inline scripts or Next.js SRI support if it becomes practical.

## P2 — Quality and regression protection

### QA-003 — Expand automated coverage around critical flows

- **Status:** In progress — authorization done 2026-11-14 (`tests/auth/`, 239 tests)
- **Evidence:** 60 Vitest tests cover popups, announcements and the rate limiter. Authorization (`lib/permissions.ts`, `lib/auth.ts`, the `adminCms` role × action matrix), the invite flow, public forms, media validation and page-builder migration have no tests.
- **Resolution:** Start with pure authorization logic (highest value, no emulator needed), then route tests for forms and invites, then a small end-to-end smoke suite.

### QA-004 — Strengthen page-builder types and compatibility tests

- **Status:** Open
- **Evidence:** ESLint reports ~120 `no-explicit-any` warnings, concentrated in `components/admin/page-builder/` and `lib/pageBuilderSafety.ts`. `PageBlock.content` is untyped.
- **Resolution:** Discriminated union keyed by block type, centralized normalization/migration, fixtures for legacy, current, nested-row and responsive documents. Once the count is near zero, raise `no-explicit-any` back to an error.

### QA-005 — Implement audit logging (currently dead code)

- **Status:** Open
- **Evidence:** `createAuditLogEntry` in `lib/auth.ts` is never called, so the dashboard's "Recent activity" panel is always empty. The Firestore create rule expects `createdAt == request.time` but the helper writes an ISO string.
- **Resolution:** Call it from `adminCms` mutations, user role changes and invite lifecycle events; fix the timestamp type.

### QA-006 — Standardize admin session helpers

- **Status:** Open
- **Evidence:** Routes mix `requireAdminSessionForRequest` (cookie or bearer) and `getCurrentAdminSession` (cookie only) without a documented rule. The admin layout still relies on the middleware-set `x-stonehill-pathname` header to skip its check for public admin paths; every admin page now also checks the session itself.
- **Resolution:** One convention per route type, documented; remove unused permissions (`users:delete`, `content:submit_for_review`) or implement them.

### QA-007 — Dependency majors still pending

- **Status:** Open
- **Note:** `package.json` overrides `jose` to 4.15.9 under `jwks-rsa` because Vercel functions cannot `require()` ESM. Remove the override once jwks-rsa loads jose via `import()` or firebase-admin drops it; the CI smoke test will catch a regression.
- **Evidence:** `firebase` (client) 12 → 13 clears a grpc-js advisory on code paths the browser does not use; Next.js 16 clears the bundled build-time `postcss` advisory. Neither is exploitable in this app today.
- **Resolution:** Upgrade deliberately, one major per change, with a preview deployment check.

### PERF-002 — Revisit `force-dynamic` on the `[slug]` catch-all route

- **Status:** Open
- **Evidence:** `app/(public)/[slug]/page.tsx` opts the whole route out of caching because of a past `DYNAMIC_SERVER_USAGE` crash.
- **Resolution:** Isolate the dynamic read behind `unstable_cache` as `lib/data/siteSettings.ts` and `lib/data/menus.ts` already do.

## P3 — Accessibility, performance, and polish

### A11Y-001 — Complete keyboard navigation polish

- **Status:** Open
- **Acceptance:** Keyboard users can skip repeated admin navigation and operate the desktop About dropdown with expected focus, arrow, Escape and activation behavior.

### PERF-001 — Audit public carousel media loading

- **Status:** Open
- **Acceptance:** Off-screen slide media is deferred (Embla `slidesInView`) without layout shift, broken transitions or reduced-motion regressions.

### UI-001 — Replace placeholder favicon with the official brand asset

- **Status:** Open — needs the brand asset

### UI-002 — Improve empty states in admin data views

- **Status:** Open
- **Acceptance:** Empty and no-results states distinguish a new module from a filtered search and offer the next action when permitted.

## Completed

| Item | Date | Change | Verification |
| --- | --- | --- | --- |
| SEC-001 Sanitize CMS-authored HTML (DOMPurify allow-list on all `dangerouslySetInnerHTML` sinks) | 2026-08-29 | `071f35f` | Merged in `5e9ac42` |
| Close direct client writes to `formSubmissions` | 2026-08-29 | `071f35f` | Rule now `allow create: if false` |
| Admin console CSP with per-request nonce | 2026-08-29 | `071f35f` | Public site: see SEC-008 |
| QA-003 phase 1: authorization tests; fixed `/admin` prefix match gating public slugs like `/administration` | 2026-11-14 | branch `test/auth-permissions` | 370 tests pass; built app: `/administration` 404, `/admin/*` 307 to login |
| DEP: Next.js 15.5.29 (RCE, cache poisoning), sharp 0.35.5, firebase-admin 14 | 2026-11-14 | `607959a` | Build, tests, sharp/firebase-admin runtime smoke tests |
| SEC-003 Shared Firestore rate limiter for forms; invite lookup/accept limits | 2026-11-14 | `25d4ce7` | Unit tests; 429 + headers verified against Firestore |
| Delete dead `/api/admin/invites/*` routes (state-leaking validate endpoint) | 2026-11-14 | `25d4ce7` | No references remain |
| QA-001 GitHub Actions CI (lint, typecheck, test, build, critical audit) | 2026-11-14 | `47d3219` | Full sequence passes from clean `npm ci` with no secrets |
| QA-002 ESLint CLI with flat config; lint errors fail the build | 2026-11-14 | `47d3219` | 0 errors |
| Fix rules-of-hooks crashes in `BlockInspector` and `LatestSermonSection` | 2026-11-14 | `47d3219` | Lint clean |
| Generic CMS error messages; dashboard session check; media size copy; dead `lib/storage.ts` and `app/api/media` | 2026-11-14 | `8c52069` | Lint, typecheck, tests |
| Announcement channels, public pages, homepage section; announcements no longer end a day early | 2026-11-14 | `4c46b6a`, `6731fa6` | Unit tests; pages verified against production data |
| SEC-002 App Check verification on `POST /api/forms` (monitor mode; enforcement is OPS-005) | 2026-11-14 | this change | Unit tests; monitor and enforce verified against Firebase with missing/forged tokens |
| SEC-006 Editor media self-approval: decided to keep auto-approve; storage rule documented as direct-upload defense in depth | 2026-11-14 | this change | Decision by owner |
| OPS-001 Firestore rules deployed (announcement `publishToWebsite` read rule) | 2026-11-14 | owner | Deployed by owner |
| OPS-002 TTL policy on `rateLimits.expiresAt` | 2026-11-14 | owner | `ttlConfig.state: ACTIVE` |
| Fix production outage: ERR_REQUIRE_ESM from jwks-rsa 4 / jose 6 on Vercel | 2026-11-14 | `86d78c6` | Reproduced with require(esm) disabled; all routes 200 in production; CI smoke test now runs the same way |
| SEC-004 zod 3 → 4 (memory-exhaustion advisory); partial-update default/refinement regressions caught by new characterization tests | 2026-11-14 | branch `chore/zod-4` | 131 tests; schema pass/fail and parsed output identical to zod 3; strict smoke test |
