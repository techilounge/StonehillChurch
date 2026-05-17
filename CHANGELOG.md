# Changelog

All notable changes to the Stonehill Church website will be documented in this file.


## [0.4.6] - 2026-05-17

### Added
- **Popup Frequency & Capping Control**
  - Integrated frequency controls into the Popups CMS layout (`CmsConfig.ts`) supporting three distinct display settings: "Show Every Time", "Show Once per Visitor", and "Show on Time Interval".
  - Created client-side frequency evaluation helpers (`lib/popup/frequency.ts`) leveraging `localStorage` for privacy-respecting visitor capping.
  - Implemented unit testing suite (`tests/popup/frequency.test.ts`) covering all frequency cooldown policies.
  - Updated `DynamicPopup.tsx` to respect visitor capping rules and automatically bypass display on suppression cooldown.
  - Enhanced cache stability in `lib/data/popups.ts` by leveraging `unstable_noStore` to prevent dynamic popup configurations from being locked into 5-minute Full Route caches.

### Fixed
- **CMS Admin Form Validation**
  - Added normalization from `undefined` to `null` for all declared form fields inside `CmsModuleForm.tsx`.
  - Resolves schema validation failures ("Required" / "Expected string, got undefined") when conditional fields hidden by `showWhen` logic remain untouched in form state.

## [0.4.5] - 2026-05-16

### Fixed
- **Livestream Thumbnail Display**
  - Updated the "Latest Sermon" section to automatically prioritize and display the thumbnail of an active livestream.
  - Added a pulsing red "LIVE" badge indicator to the corner of sermon cards when they are actively broadcasting.
  - Fixed an issue where the homepage would show the most recently recorded video rather than the currently ongoing live broadcast.
  - Ensured active livestreams are also pinned to the top of the Sermon Library grid.
- **YouTube Video Titles**
  - Implemented an HTML entity decoder to fix titles and descriptions that displayed `&quot;` and `&#39;` directly from the YouTube API, ensuring they render correctly across the site.

## [0.4.4] - 2026-05-15

### Added
- **Granular ISR Revalidation**
  - Implemented comprehensive public-side revalidation in `app/admin/cms/actions.ts` for all CMS modules (Sermons, Events, Ministries, Leaders, etc.).
  - Added support for automatic slug-based revalidation for dynamic pages, eliminating the 5-minute wait time for editor changes.
- **Content Formatting Utility**
  - Created `lib/contentFormatting.ts` to automatically handle paragraph wrapping and line breaks for CMS-authored content.
  - Integrated `formatPageContent` into About and Our Beliefs pages to ensure robust rendering of mixed HTML/prose content.

## [0.4.3] - 2026-05-15

### Added
- **Branding & Media Management**
  - Implemented a new "Branding & Media" section in the CMS for dynamic logo and favicon management.
  - Created `ImageUploadField.tsx` for secure, server-optimized asset uploads (WebP conversion, size limits).
  - Integrated dynamic Logo support across `PublicHeader`, `MobileNav`, and `PublicFooter`.
  - Converted site metadata to dynamic `generateMetadata()` for CMS-controlled browser favicons.

### Fixed
- **Logo Integration & Layout Symmetry**
  - Resolved a backend property access bug in the media upload pipeline that prevented URL retrieval.
  - Fixed a configuration mismatch where flattened Firestore keys (e.g., `general.logo_url`) were being read incorrectly as nested objects.
  - Optimized NavBar layout to prevent Church Name wrapping and ensured perfect horizontal symmetry between branding, menu items, and CTA buttons.
  - Refined Footer architecture to follow a 4-row structure (Name, Tagline, Logo, Social Icons) for improved visual balance.

## [0.4.2] - 2026-05-15

### Added
- **A11y & Motion Support**
  - Implemented keyboard navigation (arrow keys) and full ARIA semantics for the Hero Carousel.
  - Added OS-level `prefers-reduced-motion` support to the Hero Carousel and all interactive card hover animations.
  - Integrated `focus-visible` high-contrast rings across the Admin Dashboard sidebar and mobile navigation.

### Fixed
- **Security Hardening**
  - Closed an email enumeration vulnerability in the admin login by standardizing password reset success messages.
  - Implemented a strict Content-Security-Policy (CSP) in `next.config.ts`, including whitelisting for YouTube, ReCAPTCHA, and Google Maps.
- **UI/UX Polish**
  - Resolved a redundant time display bug in `EventCard` where single-time events showed duplicate ranges.
  - Fixed mobile layout wrapping in the global footer by optimizing the responsive grid for extra-small screens.
  - Added a fallback `favicon.ico` to prevent browser 404s on metadata requests.

## [0.4.1] - 2026-05-15

### Added
- **Premium UI Animations**
  - Implemented smooth, state-of-the-art hover effects for pastoral headshots (scale + translateY transitions).
  - Added interactive lift and shadow animations to all cards in the "This Sabbath" section.
  - Enhanced the "Divine Worship" card with subtle icon scaling on hover for a more premium feel.
- **Enhanced Admin Feedback**
  - Updated CMS update notifications to explicitly display which fields failed validation (e.g., missing legacy fields like `imageAlt`), allowing admins to quickly identify and fix data gaps.

### Fixed
- **CMS Validation & Legacy Support**
  - Resolved "CMS document data is invalid" errors by making newer schema fields (SEO title/description, recurring rules) optional for updates to legacy documents.
  - Fixed a critical backend bug where raw Firestore `Timestamp` objects were being rejected by Zod validators before they could be normalized to `Date` objects.
- **Build System Stability**
  - Fixed a persistent hang in `npm run build` on Windows by refactoring `cleanNextDevCache.cjs` to use asynchronous file operations with a 1-second timeout watchdog per directory, bypassing OS-level file lock deadlocks.

## [0.4.0] - 2026-05-15

### Added
- **Automated YouTube Sermon Integration**
  - Implemented dynamic sermon fetching from YouTube via Data API when enabled in settings.
  - Added `getYoutubeVideoById` service to fetch individual video metadata on demand.
  - Created a seamless adapter to map YouTube video payloads to the existing `Sermon` UI structure.
  - Integrated "Auto-Fetch Latest Sermons" toggle into `getSermons`, `getLatestSermon`, and `getSermonBySlug`.

### Fixed
- Resolved YouTube API `403 Forbidden` errors by adding a persistent `Referer` header to all server-side fetch requests, bypassing Google Cloud API key restrictions.

### Changed
- Improved Admin UI for YouTube settings with clearer instructions for multi-channel configurations.


### Added
- **Phase 15R-B: Global Design System Migration**
  - Migrated entire site to the new Stonehill brand palette: Blue (#1E3F66), Teal (#1C6B8D), and Yellow (#E7AB10).
  - Swapped legacy `stonehill-*` tokens (evergreen, gold, forest, etc.) with new brand tokens across 90+ components.
  - Implemented automated migration of neutral colors from warm stone tones to cool slate tones for better contrast with the new blue theme.
  - Applied Yeseva One (`font-display`) globally to all headings (h1-h6) with 0.02em letter spacing.
  - Integrated Reenie Beanie (`font-handwritten`) and brand yellow accent to all hero subtitles and section callouts.

### Fixed
- Fixed Next.js hydration mismatch error caused by browser extensions (ColorZilla) by adding `suppressHydrationWarning` to root layout elements.
- Cleaned up legacy typography overrides (`tracking-tight`) that were conflicting with the new display font spacing.

### Notes
- All legacy design tokens have been removed from `tailwind.config.ts` and `app/globals.css`.
- The site now strictly follows the 2026 Stonehill Church Brand Guide.
