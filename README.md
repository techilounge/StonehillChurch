# Stonehill Seventh-day Adventist Church Website

Full-stack Next.js App Router rebuild for the Stonehill SDA public website, custom admin console, and Firebase-backed CMS.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS v3.4.x with the Stonehill color theme
- Firebase Authentication
- Firestore
- Firebase Storage
- Firebase Admin SDK for server-only operations
- Vercel deployment

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.local.example .env.local
```

3. Fill in `.env.local` with values from your Firebase project and integration providers. Keep Firebase Admin, YouTube, Resend, and seed credentials server-only. Do not commit `.env.local`.

4. Start the dev server:

```bash
npm run dev
```

The `predev` and `prebuild` scripts move `.next` aside before continuing so Next starts from a fresh cache without recursively deleting folders that Windows may have locked. Moved folders are named `.next-stale-*` and are ignored by Git. After stopping Node processes, you can delete stale folders manually or set `CLEAN_NEXT_DEV_CACHE=1` for a one-time forced cleanup.

## Environment Variables

`.env.local.example` documents every expected variable with placeholder values only.

Public Firebase Web App values:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`
- `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

Server-only Firebase Admin values:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Integration values:

- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `RESEND_API_KEY`

Seed values:

- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `ADMIN_SEED_NAME`

Local emulator values:

- `FIRESTORE_EMULATOR_HOST`
- `FIREBASE_AUTH_EMULATOR_HOST`
- `FIREBASE_STORAGE_EMULATOR_HOST`

Never prefix server-only secrets with `NEXT_PUBLIC_`. Store Firebase Admin private keys as escaped newline strings, for example with `\n` between key lines.

## Firebase Project Setup

1. Create or select a Firebase project.
2. Register a Web App and copy its config into the `NEXT_PUBLIC_FIREBASE_*` values.
3. Enable Firebase Authentication. Email/Password is required for the seed admin path.
4. Create a Firestore database.
5. Create or confirm the default Firebase Storage bucket.
6. Create a Firebase Admin SDK service account for local server scripts and Vercel server runtime.
7. Register the Web App in Firebase App Check with reCAPTCHA and set `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`.
8. Review Firestore and Storage rules from `firestore.rules` and `storage.rules` before deploying rules.

Firebase Admin credentials must only be used in `.env.local`, Vercel environment variables, or other trusted server environments. Do not commit service account JSON files.

### Firebase Rules Deployment

This repository includes `firebase.json`, which points Firebase CLI deploys at `firestore.rules` and `storage.rules`.

Authenticate and select a project before deploying rules:

```bash
firebase login
firebase use --add
```

If you do not have a `.firebaserc` alias configured, pass the project explicitly:

```bash
firebase deploy --only firestore --project your_project_id
firebase deploy --only storage --project your_project_id
```

With a selected alias, the shorter commands also work:

```bash
firebase deploy --only firestore
firebase deploy --only storage
```

Do not deploy rules to production until public write paths, including form submissions, have been reviewed with App Check and abuse protection in mind.

### App Check Local Development

App Check is initialized in the browser when `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` is set. For localhost testing, use Firebase's debug token flow rather than adding `localhost` to reCAPTCHA allowed domains.

1. Set `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN="true"` in `.env.local`.
2. Start the dev server and open the app in a browser.
3. Open DevTools Console and copy the printed App Check debug token.
4. Firebase Console → App Check → Apps → StonehillChurch Web App → Manage debug tokens.
5. Register the token, then refresh localhost.

Do not set `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` in production.

## Firebase Emulator Setup

Install the Firebase CLI if you do not already have it:

```bash
npm install -g firebase-tools
```

Start local emulators from the project root:

```bash
firebase emulators:start --only auth,firestore,storage
```

When using emulators, set these in `.env.local`:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

For emulator seeding, `FIREBASE_ADMIN_PROJECT_ID`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD` are still required. Firebase Admin private key credentials are only required when seeding a hosted Firebase project.

## Vercel Setup

1. Import this repository as a Vercel Next.js project.
2. Add every value from `.env.local.example` to Vercel Project Settings as needed.
3. Do not add emulator host variables in production.
4. Keep `FIREBASE_ADMIN_*`, `YOUTUBE_API_KEY`, `RESEND_API_KEY`, and seed credentials server-only.
5. Set `NEXT_PUBLIC_SITE_URL` to the deployed public site URL so canonical URLs and the sitemap use the correct domain.

Vercel automatically provides `VERCEL_URL`, but the project prefers `NEXT_PUBLIC_SITE_URL` when it is set.

## Package Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run seed:firestore
```

Script behavior:

- `dev`: starts Next.js development mode after `predev` moves `.next` aside.
- `build`: runs `next build` after `prebuild` moves `.next` aside.
- `typecheck`: runs `tsc --noEmit`.
- `lint`: runs `next lint`. This command is supported by the current package script, though Next.js reports that `next lint` is deprecated in newer Next versions. Follow-up migration should move to ESLint CLI with the flat config, for example `eslint .`.
- `seed:firestore`: runs `scripts/seedFirestore.ts` with `tsx`.

## Firestore Seed

The seed script creates or updates:

- `users/{uid}` for the seed admin
- `siteSettings`
- `youtubeSettings`
- `homepageSlides`
- `sermons`
- `events`
- `ministries`
- `leaders`
- `announcements`
- `resources`
- `pages`

Seed a hosted Firebase project:

```bash
npm run seed:firestore
```

Required hosted seed variables:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

Required emulator seed variables:

- `FIREBASE_ADMIN_PROJECT_ID`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `FIRESTORE_EMULATOR_HOST`
- `FIREBASE_AUTH_EMULATOR_HOST`

The seed script is idempotent and uses deterministic document IDs where practical.

### Creating the First Admin User

Set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `.env.local`, then run:

```bash
npm run seed:firestore
```

The seed creates or updates the Firebase Auth user, writes the matching `users/{uid}` document, and syncs custom claims with `role: SUPER_ADMIN`, `approved: true`, and `disabled: false`. After seeding, sign in at `/admin/login` with that email and password. Re-run the seed after changing the seed admin email, password, approval state, or role claims.

### Creating Additional Admin Users

Once the first SUPER_ADMIN exists, additional admins are managed in-app:

1. Sign in at `/admin/login` as the SUPER_ADMIN.
2. Open `/admin/users` (visible only to SUPER_ADMIN).
3. Use the role selector and approve/disable buttons to assign roles
   (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `VIEWER`) and toggle approval/disabled
   status. Each change writes the Firestore `users/{uid}` doc and syncs
   Firebase custom claims via the existing helper.

New admin accounts must first be created in Firebase Auth (manually via the
Firebase console or programmatically) and have an `emailVerified` flag set
before they can sign in. Role/status assignment is then handled from
`/admin/users`.

## Project Structure

- `app/(public)`: public website routes and layout shell
- `app/admin`: custom CMS/admin routes
- `app/api`: route handlers
- `components`: public, admin, layout, shared, home, SEO, and form components
- `lib`: Firebase, Firestore, Storage, Auth, permissions, data access, SEO, YouTube, utilities, and validators
- `types`: shared TypeScript models
- `scripts`: seed and local maintenance scripts
- `public`: static assets
- `firebase.json`: Firebase CLI configuration for Firestore and Storage rules
- `src`: legacy migration reference code from the previous app structure. It is excluded from `tsconfig.json` and is not part of the active Next.js App Router build.

## Security Notes

- `.env.local` is ignored by Git.
- Never commit Firebase Admin private keys or service account JSON.
- Do not expose Firebase Admin credentials to client-side code.
- Only `NEXT_PUBLIC_*` values are browser-visible.
- API routes and server helpers must verify Firebase ID tokens and permissions before privileged work.
- Firebase App Check must be configured before public form submission endpoints go live in production.
