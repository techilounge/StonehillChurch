# Stonehill Seventh-day Adventist Church Website

Full-stack Next.js foundation for the Stonehill SDA public website, custom admin console, and Firebase-backed CMS.

## Stack

- Next.js App Router
- React and TypeScript with strict mode
- Tailwind CSS with Stonehill design tokens
- Firebase Authentication for admin sign-in
- Firestore for CMS content
- Firebase Storage for media uploads
- Vercel-ready deployment configuration
- YouTube/live streaming configuration placeholders

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
cp .env.example .env.local
```

3. Fill server-only secrets in `.env.local`. Public Firebase values can be exposed to the browser, but Firebase Admin credentials must only exist in server environments.

4. Run the dev server:

```bash
npm run dev
```

5. Validate the project:

```bash
npm run typecheck
npm run build
```

## Firebase Setup

Create or confirm the Firebase project:

- Project ID: `stonehill-sda-ch-1723416406673`
- Authentication: enable Email/Password sign-in for admin users.
- Firestore: create the database in production mode, then add security rules during the auth phase.
- Storage: create the default bucket and add upload rules during the media phase.
- Service account: create a Firebase Admin SDK service account for server-side operations.

Use these environment variables locally and in Vercel:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=
RESEND_API_KEY=
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
```

When entering `FIREBASE_ADMIN_PRIVATE_KEY` in Vercel, preserve newline characters as escaped `\n` values.

## Firestore Seed

After Firebase Admin credentials and seed admin credentials are configured:

```bash
npm run seed:firestore
```

This creates or updates:

- `users/{uid}` with the seed admin as `owner`
- `settings/site` with base site settings

## Project Structure

- `app/(public)`: public website routes and layout shell
- `app/admin`: custom CMS/admin route shell
- `app/api`: route handlers for auth, forms, media, and YouTube placeholders
- `components`: public, admin, layout, shared, home, and forms components
- `lib`: Firebase, Firestore, Storage, Auth, permissions, SEO, YouTube, utilities, validators
- `types`: shared TypeScript content, auth, form, and media models
- `scripts`: operational scripts, including Firestore seed
- `public/images`: static image assets

## Deployment

Deploy to Vercel as a Next.js project and add every variable from `.env.example` in the Vercel project settings. Keep all `FIREBASE_ADMIN_*`, `YOUTUBE_API_KEY`, `RESEND_API_KEY`, and seed credentials server-only. Do not prefix secrets with `NEXT_PUBLIC_`.

The current admin routes are intentionally placeholder-protected only. The next phase should add middleware/session checks, Firestore security rules, admin UI forms, and CMS workflows.
## Stonehill CMS Authentication and Roles

The Admin Console is planned to be protected by Firebase Authentication. UI checks are not enough for CMS security, so role enforcement must also happen in server-side helpers and Firebase Security Rules.

Admin users should receive Firebase custom claims with:

- `role`: one of `SUPER_ADMIN`, `ADMIN`, `EDITOR`, or `VIEWER`
- `approved`: `true` after the account is approved for Admin Console access

Role expectations:

- `SUPER_ADMIN`: full access, user management, critical settings, YouTube settings, media, publishing, deletion, and audit log visibility.
- `ADMIN`: manages most content, publishing, form submissions, and media. Admins must not delete users or change critical settings unless explicitly allowed.
- `EDITOR`: creates and edits content, saves drafts, uploads media, and submits content for publishing. Editors cannot manage users, settings, publishing, or important deletes.
- `VIEWER`: read-only Admin Console access.

Implemented planning files:

- `lib/permissions.ts`: shared role and permission checks.
- `lib/auth.ts`: server-side guard helpers and audit log entry helper.
- `src/components/AdminRouteGuard.tsx`: placeholder React guard for wrapping Admin Console routes once Firebase Auth state is wired into the app.
- `firestore.rules`: draft Firestore rules for public published content, admin-only collections, users, settings, YouTube settings, audit logs, and form submissions.
- `storage.rules`: draft Storage rules for public approved media, WEBP uploads, JPEG/PNG uploads that pass compression-pipeline metadata, image MIME validation, and file size limits.

Temporary limitations:

- Firebase Admin SDK token verification is not wired into this client app yet. Server endpoints or server actions must verify ID tokens before trusting `lib/auth.ts` helpers.
- Custom claims must be set from a trusted server environment, never from client code.
- Audit logs should be written by trusted server code where practical. Client-created audit logs are constrained in the draft rules but are not a replacement for server-side audit logging.
- JPEG and PNG uploads are allowed only when marked by the upload pipeline as compressed. The intended upload path is automatic compression/conversion before upload, with WEBP supported as the preferred public media format.
## Phase 7: Firebase Authentication for Admin Console

The Admin Console uses Firebase Authentication for identity and the Firestore
`users/{uid}` document for authorization. Do not store passwords in Firestore or
any CMS collection. Passwords are handled only by Firebase Authentication.

Required Firebase client environment variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Admin routes:

- `/admin/login` is the public login route.
- `/admin` and every `/admin/*` route are protected by Firebase Auth and a
  Firestore profile lookup.

Create the first admin user:

1. Enable Firebase Authentication providers in the Firebase Console, such as
   Email/Password or Google.
2. Sign in once at `/admin/login` with the intended first admin account. The
   app will deny access until a Firestore profile exists.
3. In Firestore, create `users/{uid}` where `{uid}` is the Firebase Auth UID:

```json
{
  "email": "admin@example.com",
  "firstName": "Stonehill",
  "lastName": "Admin",
  "role": "SUPER_ADMIN",
  "approved": true,
  "disabled": false
}
```

Supported roles are `SUPER_ADMIN`, `ADMIN`, `EDITOR`, and `VIEWER`. If role
loading fails, the app denies access by default and shows the unauthorized
screen.

Security notes:

- UI hiding is only convenience. Firestore rules must enforce writes using the
  `users` collection role document.
- Firebase Storage rules cannot query Firestore documents directly. Keep Storage
  rules restrictive, sync privileged upload claims only from trusted server
  code if needed, and enforce upload authorization in the Admin Console before
  creating media records.
- Server actions, API routes, and Cloud Functions must verify Firebase ID tokens
  and re-check the caller's `users/{uid}` role before privileged actions.
- `lib/adminUsers.ts` provides adapter-based server helpers for re-checking a
  caller's Firestore user role before privileged actions.
- Never expose Firebase Admin SDK credentials in client code.

## Phase 8: Media Library

The Admin Console includes a responsive Media Library at `/admin/media`.
`/admin/media/upload` opens the same Media Library with the upload panel visible.

Media upload flow:

1. The admin selects a WEBP, JPEG, or PNG image.
2. The browser validates MIME type and rejects files over 15 MB before
   processing.
3. The browser draws the image to a canvas, resizes large images to a maximum
   dimension of 2200 px, and exports an optimized WEBP.
4. Optimized uploads must be 5 MB or less.
5. The optimized WEBP is uploaded to Firebase Storage under a clean
   `media/{year}/{month}/{uid}/...webp` path.
6. Metadata is saved to Firestore in the `mediaAssets` collection.

`mediaAssets` documents include:

- `originalFilename`
- `storagePath`
- `url`
- `contentType`
- `size`
- `originalSize`
- `width`
- `height`
- `uploadedBy`
- `uploadedByEmail`
- `altText`
- `public`
- `status`
- `createdAt`
- `updatedAt`

Role behavior:

- `SUPER_ADMIN` and `ADMIN` can upload, approve public media, edit alt text,
  copy URLs, and delete media.
- `EDITOR` can upload private optimized media and edit alt text.
- `VIEWER` can browse and copy media URLs but cannot upload, edit, or delete.

Public-facing images require meaningful alt text. The UI enforces alt text on
upload and update, and the Firestore rules require longer alt text for public
approved assets.

Storage note: the local `storage.rules` file was tightened for Phase 8 to accept
optimized WEBP uploads with compressed-pipeline metadata and a 5 MB limit. If
you manually copied Storage rules before Phase 8, copy or deploy the updated
rules again. Firebase Storage rules cannot read Firestore user documents, so
direct client uploads need trusted Firebase Auth custom claims that mirror the
Firestore role, or a future Cloud Function upload endpoint that verifies the
Firestore `users/{uid}` role before writing to Storage.

## Phase 9: CMS Content CRUD

The Admin Console includes Firestore CRUD management for:

- Homepage Slides
- Sermons
- Events
- Ministries
- Leaders
- Announcements
- Resources
- Pages
- Site Settings
- YouTube Settings

Content modules are available under `/admin/content/{module}`. Site Settings
are available at `/admin/site-settings`, and YouTube Settings are available at
`/admin/youtube-settings`.

Each content module includes a responsive list/table view, create/edit form,
validation, delete confirmation, status actions where the collection supports
statuses, success/error states, permission-gated controls, and best-effort audit
log writes to `auditLogs`.

Slug fields marked as unique are checked in Firestore before save. Media URL
fields can select an existing `mediaAssets` item or accept a temporary direct
URL until a richer media picker is added.

Role behavior:

- `SUPER_ADMIN`: full content/settings access.
- `ADMIN`: create, edit, publish/unpublish, archive, delete content, manage
  site settings, and manage media.
- `EDITOR`: create and edit draft content, but cannot publish, archive, delete,
  manage users, or change site settings.
- `VIEWER`: read-only Admin Console access.

Public Firestore reads are limited in `firestore.rules` to published content or
active leader/homepage records where appropriate. Admin reads and writes are
based on the Firestore `users/{uid}` role document, not hidden UI.
