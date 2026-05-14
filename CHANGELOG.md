# Changelog

All notable changes to the Stonehill Church website will be documented in this file.

## [0.3.0] - 2026-05-14

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
