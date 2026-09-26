# Security & Code Review Follow-ups

Generated from a full codebase review on 2026-08-25. Grouped by priority —
work top to bottom. File/line references point at the state of the repo at
review time and may drift as fixes land.

---

## Critical — fix before next deploy

- [ ] **Sanitize stored HTML before rendering (Stored XSS → privilege escalation)**
  CMS `content` and page-builder `html` blocks are injected via
  `dangerouslySetInnerHTML` with no sanitization. Since ADMIN/EDITOR roles can
  author this content and it renders on the public site (same-origin as the
  admin session cookie, `SameSite=Lax`), a malicious payload can act on behalf
  of any admin who views the page — including escalating ADMIN → SUPER_ADMIN.
  - Sinks: [app/(public)/[slug]/page.tsx:120](app/(public)/[slug]/page.tsx#L120),
    [components/shared/page-builder/PageBuilderRenderer.tsx:504](components/shared/page-builder/PageBuilderRenderer.tsx#L504),
    [app/(public)/about/page.tsx:84](app/(public)/about/page.tsx#L84),
    [app/(public)/our-beliefs/page.tsx:48](app/(public)/our-beliefs/page.tsx#L48)
  - Fix: sanitize with a real parser-based library (e.g. `isomorphic-dompurify`)
    both on write (in `lib/data/adminCms.ts` validation) and defensively on
    render. Do not rely on regex sanitization (see next item).

- [ ] **Replace regex-based `sanitizeHtml` with a real sanitizer**
  [lib/pageBuilderSafety.ts:184](lib/pageBuilderSafety.ts#L184) strips
  `<script>`, `on*=` handlers, and `javascript:`/`data:` URLs with regexes.
  Bypassable via HTML entity encoding (e.g. `jav&#97;script:`) and other
  known regex-sanitizer holes. Swap for DOMPurify (server-safe build) or
  equivalent; treat every current caller as unsanitized until replaced.

- [ ] **Tighten CSP: drop `'unsafe-inline'` from `script-src`**
  [next.config.ts:52](next.config.ts#L52) allows inline scripts, which is what
  makes the stored-XSS findings above actually executable. Move to a
  per-request nonce (Next middleware can generate and thread one) or hashed
  inline scripts.

- [ ] **Close direct client writes to `formSubmissions`**
  [firestore.rules:150](firestore.rules#L150) allows any client with an App
  Check token to `create` directly, bypassing the honeypot and rate limiter in
  `app/api/forms/route.ts` entirely, and can set `status`/`internalNotes`
  itself. Nothing in the app uses this path — change to `allow create: if false`.

## High

- [ ] **Delete the dead `/api/admin/invites/*` route tree**
  The UI only calls `/api/admin/users/invites/*`. The old tree is still live,
  including an unauthenticated
  [validate/route.ts](app/api/admin/invites/validate/route.ts) that leaks
  distinct error codes (`INVITE_EXPIRED` / `INVITE_ACCEPTED` / `INVITE_REVOKED`),
  defeating the enumeration protection its sibling
  [lookup/route.ts](app/api/admin/users/invites/lookup/route.ts) explicitly
  implements (single canonical 404). Delete: `app/api/admin/invites/route.ts`,
  `.../accept/route.ts`, `.../validate/route.ts`, `.../revoke/route.ts`.

- [ ] **Fix the form-submission rate limiter**
  [app/api/forms/route.ts:27](app/api/forms/route.ts#L27) uses an in-memory
  `Map`, which is per-instance and reset on cold start on Vercel serverless —
  the 5-per-10-minutes cap is not reliably enforced. Also never evicts expired
  entries (unbounded growth on a warm instance), and trusts the client-supplied
  end of `x-forwarded-for`. Move to a shared store (Vercel KV/Upstash) or
  platform-level rate limiting (Vercel WAF / Firebase App Check enforcement).

## Medium

- [ ] **Enforce (or remove) the `critical` settings permission boundary**
  [lib/data/adminCms.ts:186](lib/data/adminCms.ts#L186) maps every settings
  action to the same `settings:manage` permission — `settings:critical:manage`
  is declared in `lib/permissions.ts` and checked in `firestore.rules` but
  never enforced on the server path that the app actually uses (Admin SDK
  bypasses Firestore rules). Either wire a real `critical` field through
  `siteSettingSchema` and gate it, or drop the unused permission and rule
  clause so the boundary isn't documented-but-fictional.

- [ ] **Fix EDITOR media self-approval**
  `storage.rules` declares `editorCannotSelfApprovePublicMedia()`, but
  [lib/data/mediaAssets.ts:265](lib/data/mediaAssets.ts#L265) hardcodes
  `public: true, status: "approved"` for every upload regardless of role, and
  the Admin SDK write bypasses the Storage rule anyway. Decide the intended
  behavior (EDITOR uploads require ADMIN approval before going public?) and
  implement it server-side, since the rule as written currently does nothing.

- [ ] **Remove header-based admin-page auth shortcut**
  [app/admin/layout.tsx:20](app/admin/layout.tsx#L20) skips the session check
  based on an `x-stonehill-pathname` request header set by middleware. Every
  other admin page independently calls `getCurrentAdminSession()` except
  [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx), which relies
  solely on the layout. Add an explicit `getCurrentAdminSession()` call there
  so a future middleware change can't silently expose it.

- [ ] **Invite tokens in URL query strings**
  [lib/data/userInvites.ts:132](lib/data/userInvites.ts#L132) builds invite
  links as `?token=...`, so tokens land in browser history, referrer headers,
  and server access logs. Consider a one-time-use redemption step or at least
  documenting the exposure window (tokens are already hashed at rest and
  single-use-by-status, which limits blast radius).

- [ ] **Add rate limiting to invite-accept endpoints**
  `POST /api/admin/users/invites/accept` (password-based acceptance) has no
  rate limiting and creates a Firebase Auth user with `emailVerified: true` on
  token possession alone. Add attempt limiting per token/IP.

## Low

- [ ] **Implement audit logging (currently dead code)**
  `createAuditLogEntry` in [lib/auth.ts:124](lib/auth.ts#L124) is defined but
  never called anywhere in the app — grepped the full tree. The dashboard's
  "recent activity" panel ([lib/data/auditLogs.ts](lib/data/auditLogs.ts))
  will always be empty, and `audit_logs:read` permission governs an empty
  collection. Also note: the Firestore create rule requires
  `createdAt == request.time`, but the helper produces an ISO string — fix
  that mismatch when wiring this up. Call this from `adminCms` mutations, user
  role changes, and invite lifecycle events.

- [ ] **Remove dead code**
  - `lib/storage.ts` (`uploadPublicFile`) — targets `images/`, `sermons/`,
    `forms/` paths that `storage.rules` denies; would fail at runtime.
  - `app/api/media/route.ts` — unused duplicate of `/api/admin/media`.
  - Four unenforced permissions in `lib/permissions.ts`: `users:delete`,
    `content:submit_for_review`, `audit_logs:read` (until audit logging above
    is implemented), and `settings:critical:manage` (until the item above is
    resolved) — implement or remove each.

- [ ] **Standardize on one admin-session helper**
  Routes inconsistently mix `requireAdminSessionForRequest` (cookie OR bearer
  token) and `getCurrentAdminSession` (cookie only) with no apparent
  rationale. Pick one convention per route type (API route vs. Server Action)
  and document it.

- [ ] **Stop leaking internal error messages to the client**
  [app/admin/cms/actions.ts:31](app/admin/cms/actions.ts#L31)
  (`handleCmsError`) returns raw `error.message` from unexpected exceptions,
  which can surface Firestore index-creation URLs, project IDs, or other
  internal details. Map unexpected errors to a generic message and log the
  detail server-side only.

- [ ] **Fix incorrect size-limit copy in media upload errors**
  [lib/data/mediaAssets.ts](lib/data/mediaAssets.ts) error messages cite
  "12 MB" and "5 MB" against an actual `MAX_SOURCE_BYTES` of 2 MB — update the
  strings to match the real constants.

---

## Non-security follow-ups

- [ ] **Add a test suite for the authorization core**
  `lib/permissions.ts`, `lib/auth.ts`, the `adminCms` role×action matrix, and
  the invite flow are pure, high-value, and currently have zero test coverage
  (only `tests/popup/*` exists, ~1% of the codebase). This is the code most
  worth testing given how much of the app's security model lives in it.

- [ ] **Re-enable ESLint in the build**
  [next.config.ts:5](next.config.ts#L5) sets `eslint.ignoreDuringBuilds: true`,
  so lint never gates a deploy. Fix outstanding lint issues and turn this off;
  also migrate `next lint` → flat-config `eslint .` per the README's own
  deprecation note.

- [ ] **Revisit `force-dynamic` on the `[slug]` catch-all route**
  [app/(public)/[slug]/page.tsx](app/(public)/[slug]/page.tsx) opts the entire
  route out of caching because of a `DYNAMIC_SERVER_USAGE` crash. Likely
  fixable by isolating the dynamic Firestore read behind `unstable_cache`
  (as already done in `lib/data/siteSettings.ts` and `lib/data/menus.ts`)
  rather than de-optimizing the whole route.

- [ ] **Reduce `any` usage in the page builder**
  94 occurrences of `: any` / `as any` across the codebase, concentrated in
  `components/admin/page-builder/` and `lib/pageBuilderSafety.ts`. Tighten
  types incrementally, starting with the sanitization/validation code paths
  since that's exactly where type looseness hides bugs.
