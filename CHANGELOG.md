# Changelog

All notable changes to the Stonehill Church website will be documented in this file.


## [0.7.2] - 2026-06-07

### Added
- **Global Spacing Tokens (XS / SM / MD / LG / XL)**
  - **Settings UI**: New "Design Tokens · Spacing" section in [SettingsEditor.tsx](app/admin/settings/SettingsEditor.tsx) with five numeric inputs (XS / SM / MD / LG / XL) stored under a new `design` settings group as `spacing_tokens: { xs, sm, md, lg, xl }`. Defaults to a Tailwind-ish scale (4 / 8 / 16 / 32 / 64 px).
  - **Typed data layer**: Added `SpacingTokens` + `DEFAULT_SPACING_TOKENS` to [types/settings.ts](types/settings.ts), plus `getSpacingTokens()` and a 300-second-cached `getCachedSpacingTokens()` in [siteSettings.ts](lib/data/siteSettings.ts) that returns a fully-defaulted token set (any missing or invalid field falls back to the system value).
  - **Schema**: `StructuredPadding` (and therefore `StructuredMargin`) gained an optional `token?: "xs"|"sm"|"md"|"lg"|"xl"` field. When set, it overrides the per-side numeric values for that device and renders as the matching CSS variable. Validators in [validators.ts](lib/validators.ts) accept the new field for both block- and section-style schemas; sanitization in [pageBuilderSafety.ts](lib/pageBuilderSafety.ts) passes through with an enum check.
  - **Inspector UX**: The shared [SpacingControl](components/admin/page-builder/SpacingControl.tsx) now shows a token chip row above the four-side inputs. Picking a token (XS/SM/MD/LG/XL) applies it to all four sides at once; the four numeric inputs are disabled while a token is active. Clicking "Custom" or editing any side number drops the token automatically. A footer hint reads "Using token MD — edit in Settings → Design Tokens" so admins know where the value comes from.
  - **Rendering**: [PageBuilderRenderer.tsx](components/shared/page-builder/PageBuilderRenderer.tsx) emits CSS custom properties (`--pb-space-xs` … `--pb-space-xl`) scoped to the `.page-builder-content` root. The spacing shorthand resolves token values as `var(--pb-space-${name})` so an edit in Settings flows through every page without a republish. Accepts a new optional `spacingTokens` prop; defaults to the system tokens when omitted so existing call sites keep working.
  - **Canvas preview**: [BuilderCanvas.tsx](components/admin/page-builder/BuilderCanvas.tsx) exposes the same CSS variables on its wrapper, and the canvas spacing helper in [SortableSection.tsx](components/admin/page-builder/SortableSection.tsx) resolves tokens through `var(--pb-space-*)` too — so the editor preview updates live when token values change in Settings.
  - **Wiring**: The named-route renderers ([/about](app/(public)/about/page.tsx), [/our-beliefs](app/(public)/our-beliefs/page.tsx), [/[slug]](app/(public)/[slug]/page.tsx)) and [admin/pages/[id]](app/admin/pages/[id]/page.tsx) all fetch tokens server-side and pass them through. Cache key is `["site-settings", "spacing-tokens"]` with a 300-second revalidate, sharing the `"site-settings"` cache tag so saving in the admin invalidates the public reads on the next request.

## [0.7.1] - 2026-06-07

### Added
- **Page Builder — Responsive Padding & Margin (Desktop / Tablet / Mobile) + Margin Control**
  - **Per-device spacing**: Both padding and margin can now be authored independently per device. `SectionStyle` and `BlockStyle` in [pageBuilder.ts](types/pageBuilder.ts) gained `paddingValuesTablet` / `paddingValuesMobile` / `marginValues` / `marginValuesTablet` / `marginValuesMobile` sibling fields (additive — pre-existing pages with only `paddingValues` continue to render unchanged). Matching enum / hex / range guards in [validators.ts](lib/validators.ts) (padding 0..500, margin −500..500 for hero-overlap effects) and clamping pass-through in [pageBuilderSafety.ts](lib/pageBuilderSafety.ts).
  - **Unified SpacingControl**: New [SpacingControl.tsx](components/admin/page-builder/SpacingControl.tsx) exports `PaddingControlV2` and `MarginControl` (thin wrappers). Renders the four-side numeric inputs, link toggle, unit selector, and a `Desktop / Tablet / Mobile` device-tab strip. The tab strip is synced with `devicePreview` in `PageBuilderContext`, so switching device tabs anywhere — inspector or canvas toolbar — updates everything at once. Tablet/mobile values cascade from desktop until explicitly set; an "Inherit" link clears the active-device override.
  - **Section now uses the structured control**: Replaced Section Inspector's preset "Padding" `<SelectInput>` (None / Small / Medium / Large) with the new responsive PaddingControl. The legacy `padding` Tailwind class is still honored for documents that haven't migrated; it's dropped only when `paddingValues` is set.
  - **MarginControl added to Section + Row + Column inspectors** alongside PaddingControl.
  - **Canvas device preview**: [BuilderCanvas.tsx](components/admin/page-builder/BuilderCanvas.tsx) gets a toolbar device picker (`Monitor` / `Tablet` / `Smartphone` icons) that constrains the canvas `max-width` to 1024px (tablet) or 640px (mobile). When active, the canvas content is wrapped in a centered, ring-bordered preview frame.
  - **Real-time canvas preview**: [SortableSection.tsx](components/admin/page-builder/SortableSection.tsx) now resolves and applies the effective per-device padding/margin on every section / row / column, so what you see in the editor at each device tab matches what the live site renders at that width.
  - **Public renderer**: [PageBuilderRenderer.tsx](components/shared/page-builder/PageBuilderRenderer.tsx) tags each section / row / column with `data-pb-id={id}` and walks the document once at render time to emit a single `<style>` block per page with `@media (max-width:1024px)` and `@media (max-width:640px)` rules. Desktop values render inline; the media-query rules override at smaller widths.

## [0.7.0] - 2026-05-31

### Added
- **Page Builder — Independent Column Padding Controls (+ columns are now selectable)**
  - **Selectable columns**: Clicking a column on the canvas in [SortableSection.tsx](components/admin/page-builder/SortableSection.tsx) now selects it (stop-propagated so it doesn't bubble to the row/section) and draws an accent-colored ring. The cursor is now `cursor-pointer` to communicate that columns are interactive.
  - **ColumnInspector**: [BuilderInspector.tsx](components/admin/page-builder/BuilderInspector.tsx) gained a column branch in its element resolver and a new `ColumnInspector` panel that uses the same reusable `PaddingControl` from the row work. Inspector header now shows "Column Settings".
  - **Context action**: [PageBuilderContext.tsx](components/admin/page-builder/PageBuilderContext.tsx) gets a new `handleUpdateColumn(sectionId, columnId, updates, rowId?)` that walks both the modern `section.rows[].columns` shape and the legacy `section.columns` shape so it works whether or not the section has been migrated.
  - **Schema**: `BlockStyle` (the type columns use) gained the same `paddingValues?: StructuredPadding` field that was added to `SectionStyle` in 0.6.9. Matching guards added to [blockStyleSchema](lib/validators.ts); sanitization already accepted the field for both `isBlock` branches, so no sanitizer change was needed.
  - **Rendering**: `ColumnRenderer` in [PageBuilderRenderer.tsx](components/shared/page-builder/PageBuilderRenderer.tsx) now applies the CSS `padding: T R B L` shorthand inline when `paddingValues` is set and drops the legacy Tailwind padding class. The editor canvas in `SortableSection` mirrors the same behavior for real-time WYSIWYG.

## [0.6.9] - 2026-05-31

### Added
- **Page Builder — Independent Row Padding Controls**
  - **Schema**: Added a `StructuredPadding` type (`{ top, right, bottom, left, unit?, linked? }`) to [pageBuilder.ts](types/pageBuilder.ts) and a new optional `paddingValues` field on `SectionStyle`. Matching enum/range guards in [sectionStyleSchema](lib/validators.ts) and pass-through (with 0..500 clamping and `px`/`rem`/`%` unit enum) in [sanitizeStyle](lib/pageBuilderSafety.ts).
  - **Reusable PaddingControl Component**: New [PaddingControl.tsx](components/admin/page-builder/PaddingControl.tsx) renders four numeric inputs (T / R / B / L) with a link toggle (`Link2`/`Unlink2` icons) that snaps all four sides together, a reset button, and a unit selector (px / rem / %). Self-clears the field when all four sides are 0 and the link is off, so a docs don't accumulate empty objects.
  - **Wired into Row Inspector**: The Row Settings panel's old "Padding" preset dropdown is replaced with the new control. The legacy `padding` Tailwind-class field stays in the schema (still used by Section settings and pre-existing rows), but `paddingValues` takes precedence whenever it's set.
  - **Rendering**: [PageBuilderRenderer.tsx](components/shared/page-builder/PageBuilderRenderer.tsx) and the editor canvas in [SortableSection.tsx](components/admin/page-builder/SortableSection.tsx) generate the CSS `padding: T R B L` shorthand inline when `paddingValues` is set and drop the legacy class so the two don't compose. Real-time preview is automatic — every change in the inspector flows through the same state the canvas reads.
  - **Backward compatibility**: Existing rows authored with the preset dropdown continue to render with their `p-*`/`py-*` class unchanged; the new structured form is purely opt-in per row.

## [0.6.8] - 2026-05-31

### Fixed
- **Hydration error from nested `<main>` elements on every public page.** The (public) layout wrapped its children in `<main id="main-content" tabIndex={-1}>`, and every page file inside the group (including /about, /our-beliefs, /[slug], /sermons, /events, /ministries, etc.) wrapped its own content in another `<main>`. Browsers auto-close the outer `<main>` when they parse a nested one, which made React 19/Turbopack flag a hydration mismatch (the SSR/CSR DOMs disagreed about where `id="main-content"` lived). The mismatch surfaced first on `/about` after the builder-render branch landed but was latent across every public route. Changed the layout's wrapper to a `<div id="main-content" tabIndex={-1}>` in [layout.tsx](app/(public)/layout.tsx) — the skip-to-content anchor still works (the id is preserved, tabIndex still allows programmatic focus), and each page's own `<main>` is now the actual semantic landmark.

## [0.6.7] - 2026-05-31

### Fixed
- **/about and /our-beliefs ignored Page Builder content.** Both routes called `getPageBySlug()` and rendered the page's title + legacy HTML `content` field, but never checked the document's `builderData`. As a result, admins who composed an `about` or `our-beliefs` page in the Page Builder saw a fully-built page in the editor and a hardcoded fallback (or stale HTML) on the live site. [app/(public)/about/page.tsx](app/(public)/about/page.tsx) and [app/(public)/our-beliefs/page.tsx](app/(public)/our-beliefs/page.tsx) now follow the same priority order as the dynamic `/[slug]` route: render the builder when `builderData.sections` is populated, fall back to legacy HTML content when not, and finally to the hardcoded curated layout. Each route's `<PageHero>` and bottom CTAs stay in place either way; on `/about` the "Back to Home" link also still renders above the builder content.

## [0.6.6] - 2026-05-31

### Added
- **Page Builder — Page-Level Background (Phase 3)**
  - **Schema**: Added a `PageBackground` type to [content.ts](file:///c:/Users/techi/APPs/Stonehill/types/content.ts) (a strict subset of `SectionStyle`'s background fields) and an optional `pageBackground` property on `PageContent`. Matching `pageBackground` validator added to [pageSchema](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts) with the same enum / hex / range guards used for sections.
  - **Inspector**: Added a new "Page background" block to the page settings panel in [PageBuilderShell.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/PageBuilderShell.tsx). Reuses the [BackgroundPanel](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/BackgroundPanel.tsx) component verbatim, so admins get the same `None / Color / Image / Gradient` type chips plus position/size/repeat/attachment + overlay (image) or two-stop gradient builder.
  - **Public Render**: [\[slug\]/page.tsx](file:///c:/Users/techi/APPs/Stonehill/app/(public)/[slug]/page.tsx) wraps the page (hero + back-link + builder sections) in a relative container that applies the page-level fill, with an absolutely-positioned overlay div between the background and the content. Section-level backgrounds layer on top of the page background unchanged.

## [0.6.5] - 2026-05-31

### Changed
- **Page Builder — Background Type Selector (Phase 2)**
  - **Unified Type Picker**: Replaced the separate Background Color and Background Image controls in the Section + Row inspectors with a single Background panel headed by a `None / Color / Image / Gradient` chip selector. Switching types clears the inactive variants so the renderer + sanitizer never see conflicting data.
  - **Gradient Builder**: Added a new linear-gradient background type. Pick a From color, a To color, and an angle (0–360°) via a range slider; the preview swatch updates live. Stored on the section/row style as a structured `backgroundGradient: { from, to, angle }` object.
  - **Schema + Sanitization**: Extended `SectionStyle` in [pageBuilder.ts](file:///c:/Users/techi/APPs/Stonehill/types/pageBuilder.ts) with `backgroundType` and `backgroundGradient`, with matching enum/regex/range guards in [sectionStyleSchema](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts) and [sanitizeStyle](file:///c:/Users/techi/APPs/Stonehill/lib/pageBuilderSafety.ts) (gradient colors must be `#RRGGBB`; angle must be 0..360).
  - **Renderer**: [PageBuilderRenderer.tsx](file:///c:/Users/techi/APPs/Stonehill/components/shared/page-builder/PageBuilderRenderer.tsx) and the [SortableSection.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/SortableSection.tsx) canvas now use a type-aware fill resolver. When `backgroundType` is unset (pre-Phase-2 documents), the type is inferred from whichever of image / gradient / color is populated, so existing pages render identically without a data migration. The overlay continues to render only on image backgrounds (gradients/colors can be authored at full opacity directly).

## [0.6.4] - 2026-05-31

### Added
- **Page Builder — Section & Row Background Images (Phase 1)**
  - **Schema**: Extended `SectionStyle` in [pageBuilder.ts](file:///c:/Users/techi/APPs/Stonehill/types/pageBuilder.ts) with `backgroundPosition`, `backgroundSize`, `backgroundRepeat`, `backgroundAttachment`, `overlayColor`, and `overlayOpacity`. Added enum constraints to [sectionStyleSchema](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts) and the corresponding pass-through (with `isValidSafeUrl` and `#RRGGBB`/`0..1` regex/range checks) in [sanitizeStyle](file:///c:/Users/techi/APPs/Stonehill/lib/pageBuilderSafety.ts). `backgroundImage` was previously declared in the type but stripped on save — now it round-trips through the sanitizer.
  - **Inspector UI**: New shared [BackgroundPanel.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/BackgroundPanel.tsx) with image URL + Browse (opens the Media library), live preview thumbnail honoring position/size/repeat, dropdowns for Position (9 anchors) / Size (cover/contain/auto) / Repeat (4 modes) / Attachment (scroll/fixed parallax), and an Overlay block with color picker + opacity slider (live preview swatch). Wired into both the Section and Row inspectors. A Clear button resets every background field at once. Info icons explain each control.
  - **Public Render**: [PageBuilderRenderer.tsx](file:///c:/Users/techi/APPs/Stonehill/components/shared/page-builder/PageBuilderRenderer.tsx) now applies all background-image fields and renders the overlay as an absolutely-positioned div layered above the image but below content (content is wrapped with `relative` so it stacks above the overlay).
  - **Editor Canvas Preview**: [SortableSection.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/SortableSection.tsx) mirrors the same rendering so changes show up in real time. `attachment: fixed` is intentionally suppressed in the editor preview — it would anchor to the viewport instead of the section and confuse the WYSIWYG view.
  - **Out of scope (planned follow-ups)**: page-level background, background-type selector (None / Color / Image / Gradient), responsive desktop/tablet/mobile image variants, IntersectionObserver lazy-load + JS parallax.

## [0.6.3] - 2026-05-31

### Added
- **Page Builder Inspector — Info Icons**: Added a reusable [InspectorLabel](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/InspectorLabel.tsx) component that wraps the inspector's uppercase label style and accepts optional `tooltip` / `popover` props, plumbing straight into the same [InfoIcon](file:///c:/Users/techi/APPs/Stonehill/components/admin/shared/InfoIcon.tsx) (portal-positioned with auto-flip) used elsewhere in the CMS. Authored a curated set of ~15 tooltips/popovers across [BuilderInspector.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/BuilderInspector.tsx) on the controls that are easiest to misread — Section/Row Layout Structure, Column Vertical Alignment, Content Width, Image Source, Resize Behavior, Object Fit (popover with mode breakdown), Shadow, Corner Radius, Embed URL (popover with Google Maps source instructions), CTA Background Style / Background Image, Carousel Transition, IconBox Top Element / Title Level, and Label Padding. The remaining labels are intentionally untouched but trivial to extend later by swapping `<label>` for `<InspectorLabel tooltip="…">`.

## [0.6.2] - 2026-05-31

### Fixed
- **InfoIcon tooltips/popovers clipped near form edges**: When the trigger sat near the form's left edge (e.g. the Slide Title field), the floating panel was clipped by the form wrapper's `overflow-hidden` and could also overflow the viewport. Rewrote [InfoIcon.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/shared/InfoIcon.tsx) to render the panel through a `react-dom` portal into `document.body` with fixed positioning, plus an auto-flip placement algorithm that tries the preferred side first and falls back to whichever of top/bottom/right/left actually fits in the viewport (horizontal clamping handles the residual cases). Removed `overflow-hidden` from the form wrapper in [CmsModuleForm.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsModuleForm.tsx) since the corners are still rounded by the form border and nothing inside actually overflows. Tooltip mode now uses React `onMouseEnter`/`onFocus` handlers (instead of CSS hover) so it benefits from the same placement logic.

## [0.6.1] - 2026-05-31

### Added
- **CMS Info-Icon Popover Mode**: Wired the InfoIcon component's popover mode into the CMS form. Added a `popover?: string` field on `FieldConfig` in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts); when set it takes precedence over `tooltip` and renders a click-to-open popover (wider, multi-line) instead of a hover tooltip. The PopoverIcon in [InfoIcon.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/shared/InfoIcon.tsx) now applies `whitespace-pre-line` for string content so `\n` in config maps to paragraph breaks. Demoed on the Homepage Slides `focalPointZoom` and Popups `frequencyMode` fields — both had multi-sentence descriptions that read much better as bulleted popovers.

## [0.6.0] - 2026-05-31

### Added
- **Global Info Icons in the CMS Form**
  - **InfoIcon Component**: New [InfoIcon.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/shared/InfoIcon.tsx) supports two modes — a CSS-driven hover/focus tooltip (with tap-toggle + click-outside + ESC for touch) and a click-driven popover for longer explanations. Both modes are keyboard accessible (`<button>` trigger with ARIA label / `aria-describedby`/`aria-expanded`), respect `motion-safe` for the fade animation, and take a `position` (top / right / bottom / left) and `width` for layout control. Tooltip mode is purely CSS-based on hover/focus so there's zero JS cost when idle.
  - **Form Integration**: Added an optional `tooltip?: string` field to `FieldConfig` in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts). [CmsModuleForm.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsModuleForm.tsx) now renders an InfoIcon next to the field label whenever `tooltip` is set. Existing inline `description` paragraphs are preserved — the two are additive so longer guidance still reads inline.
  - **Initial Rollout**: Authored short tooltips across the standard CMS modules — Homepage Slides, Sermons, Events (including Recurring / End Conditions / Registration URL / Featured / Category), Announcements (priority, action URL, image), Leaders (photo, active, featured-on-homepage, category), Leader Categories, Resources (file vs external URL, category), and Ministries. Each tooltip is one short sentence; the Page Builder Inspector is intentionally out of scope for this PR (separate codepath, planned as a follow-up).

## [0.5.9] - 2026-05-31

### Added
- **Events — "Open Registration Link in New Tab" toggle**: Added optional `registrationOpenInNewTab` boolean on the `ChurchEvent` type and [eventSchema](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts). The Event admin form in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts) renders the toggle directly under the Registration URL (with `showWhen` so it only appears once a URL is entered), defaulting to ON to match the previous behavior. The event detail page in [\[slug\]/page.tsx](file:///c:/Users/techi/APPs/Stonehill/app/(public)/events/[slug]/page.tsx) treats undefined as true and only sets `target="_blank"` + `rel="noopener noreferrer"` (and the external-link icon) when the toggle is on; flip it off per event to keep the registration link in the same tab.

## [0.5.8] - 2026-05-31

### Added
- **Events — Recurrence Time Overrides**: Added optional `recurrenceStartTime` / `recurrenceEndTime` (`"HH:MM"`) fields on the `ChurchEvent` type and [eventSchema](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts). The [RecurrenceEditor](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/RecurrenceEditor.tsx) now renders two `time` inputs that default to the event's main Start/End time-of-day; admins can override to use a different time for every recurring instance without changing the event's first occurrence. When [getUpcomingEvents](file:///c:/Users/techi/APPs/Stonehill/lib/data/events.ts) shifts a recurring event to its next occurrence, the override times are applied before serializing, so EventCard renders the correct upcoming time.

## [0.5.7] - 2026-05-31

### Added
- **Events — "Event has no end date" toggle**: New `endsNever` boolean on the Event admin form in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts). When enabled, the End Date & Time field is hidden via `showWhen` and the schema in [validators.ts](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts) skips the `endDateTime >= startDateTime` cross-field refine. `endDateTime` is now nullable on the `ChurchEvent` type, and the existing EventCard / event detail / shift logic already handled null end dates so single + recurring ongoing events render with start time only. The recurrence editor's own end-condition controls (Never / On / After N) continue to drive the RRULE itself, so an event marked "no end date" with recurrence "Ends Never" produces a true infinite RRULE.

## [0.5.6] - 2026-05-31

### Fixed
- **Upcoming Events list excluded recurring events whose anchor was in the past.** The Firestore query in [events.ts](file:///c:/Users/techi/APPs/Stonehill/lib/data/events.ts) filtered by `startDateTime >= now`, so a weekly event created in the past (e.g. Wednesday Night Prayer Meeting) never resurfaced even though it had future instances. `getUpcomingEvents` now fetches all published events, evaluates each recurring event's next occurrence via the new [nextOccurrence](file:///c:/Users/techi/APPs/Stonehill/lib/recurrence.ts) helper, and shifts the returned `startDateTime` / `endDateTime` to that next instance so the EventCard renders the upcoming date. Non-recurring past events still drop out; nothing changes for events with future anchor dates.

### Added
- **lib/recurrence.ts — Occurrence Calculator**: New `nextOccurrence(rule, anchor, after?)` function that walks DAILY / WEEKLY (BYDAY) / MONTHLY (BYMONTHDAY or BYDAY with positional prefix) / YEARLY rules forward from the anchor and returns the first occurrence at or after `after`. Honors COUNT and UNTIL end conditions and bails after a safety cap so malformed rules can't infinite-loop.

## [0.5.5] - 2026-05-31

### Added
- **Events — Preset Recurrence Editor**
  - **Visual Picker Replaces Raw RRULE**: Removed the free-text Recurrence Rule input from the Event editor. Admins now pick from Daily / Weekly / Bi-weekly / Monthly / Yearly / Custom, with contextual sub-controls (weekday checkboxes, monthly by-date vs by-relative-day, end conditions: never / on date / after N occurrences).
  - **RRULE Library**: New [lib/recurrence.ts](file:///c:/Users/techi/APPs/Stonehill/lib/recurrence.ts) handles parse → state → build round-trips and classifies an existing RRULE into the matching preset (FREQ=WEEKLY;INTERVAL=2 → Bi-weekly, FREQ=MONTHLY with prefixed BYDAY → Monthly relative-day, etc.). Unmappable patterns fall through to Custom.
  - **Editor Component**: New [RecurrenceEditor.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/RecurrenceEditor.tsx) renders the visual picker. Wired into the generic CMS form via a new `"recurrence"` field type in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts) (with `showWhen: data.recurring === true` so the editor only appears when the toggle is on). The generated RRULE is persisted to the same `recurrenceRule` field, so existing events load straight into the preset that matches.
- **Announcements — Open Action URL in New Tab**
  - **CMS Toggle**: Added an "Open Action URL in New Tab" boolean directly under the Action URL field in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts), with helper text "Enable this to open the Action URL in a new browser tab." Defaults to off so existing announcements keep opening in the same tab.
  - **Schema & Type**: Added optional `openInNewTab` to [announcementSchema](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts) and the `Announcement` type in [content.ts](file:///c:/Users/techi/APPs/Stonehill/types/content.ts).
  - **Renderer**: Plumbed the flag through [TopAnnouncementBar.tsx](file:///c:/Users/techi/APPs/Stonehill/components/public/TopAnnouncementBar.tsx) → [AnnouncementBannerCarousel.tsx](file:///c:/Users/techi/APPs/Stonehill/components/public/AnnouncementBannerCarousel.tsx) → [AnnouncementBanner.tsx](file:///c:/Users/techi/APPs/Stonehill/components/public/AnnouncementBanner.tsx). When enabled, the action link renders with `target="_blank"` and `rel="noopener noreferrer"`; otherwise it stays in-tab.

### Fixed
- **CMS Date Picker Off-By-One**: `<input type="date">` emits `"YYYY-MM-DD"`, which `new Date(...)` parses as UTC midnight. When the value was read back through local-time getters in [CmsModuleForm.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsModuleForm.tsx) in any timezone west of UTC (e.g. CDT), the input flipped to the previous day on every render. Fixed by constructing the Date with the local-midnight constructor (`new Date(year, monthIndex, day)`) for `type: "date"` fields so the round-trip is stable. `datetime-local` was already correct.

## [0.5.4] - 2026-05-30

### Added
- **Homepage Welcome — Featured Leaders Control**
  - **CMS Field**: Added a "Featured on Homepage" toggle on the Leader admin form in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts), with a description explaining that the first two flagged leaders (by Sort Order) appear in the homepage Welcome section.
  - **Schema & Type**: Added optional `featuredOnHomepage` to [leaderSchema](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts) and the `Leader` type in [content.ts](file:///c:/Users/techi/APPs/Stonehill/types/content.ts).
  - **Renderer**: [WelcomeSection.tsx](file:///c:/Users/techi/APPs/Stonehill/components/public/WelcomeSection.tsx) now prefers leaders explicitly flagged for the homepage; if no leader is flagged it falls back to the previous behavior (top two active leaders by sort order) so existing sites keep rendering unchanged.
- **Media Library Delete (Single + Bulk)**
  - **Per-card Delete**: Added a Delete button to the hover overlay of each media card in [MediaGrid.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/media/MediaGrid.tsx). Opens a confirmation dialog naming the file before destruction.
  - **Bulk Delete Mode**: New "Select" toolbar action in [MediaManager.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/media/MediaManager.tsx) toggles a multi-select mode with per-card checkboxes, a "Select all" shortcut, and a `Delete (N)` toolbar button. Cancel exits without changes.
  - **API + Data Layer**: Added a `DELETE` handler in [route.ts](file:///c:/Users/techi/APPs/Stonehill/app/api/admin/media/route.ts) gated on the `media:manage` permission, capped at 100 ids per request. New `deleteMediaAsset` / `deleteMediaAssets` helpers in [mediaAssets.ts](file:///c:/Users/techi/APPs/Stonehill/lib/data/mediaAssets.ts) remove both the Firestore metadata doc and the underlying Firebase Storage object, reporting partial failures per id.
- **Active-Use Warning Before Media Delete**
  - **Cross-Collection Usage Scanner**: New [mediaUsage.ts](file:///c:/Users/techi/APPs/Stonehill/lib/data/mediaUsage.ts) scans every content collection (site settings, pages including builder block content, homepage slides, sermons, events, ministries, leaders, announcements, resources, popups) for references to each asset's signed Firebase download URL. Detection is JSON-substring exact, so builder-block image URLs inside `content: any` are caught too.
  - **Usage API Endpoint**: Added `POST /api/admin/media/usage` in [route.ts](file:///c:/Users/techi/APPs/Stonehill/app/api/admin/media/usage/route.ts), gated on `media:read`, returning a per-id list of usages with the area, doc id, and human-friendly label (page title, ministry name, etc.).
  - **Warning Dialog UX**: When a delete is requested in [MediaManager.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/media/MediaManager.tsx), the dialog opens immediately with a "Checking where this file is used…" loader, then either upgrades to an amber "Warning: this file is in active use" banner listing each reference (with the confirm button switching to "Delete anyway") or falls back to the normal confirmation. Bulk delete shows a per-file breakdown of only the files that are actually in use.
  - **ConfirmDialog Generalized**: [ConfirmDialog.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/shared/ConfirmDialog.tsx) now accepts a `ReactNode` description (to support the structured usage list) and a `confirmDisabled` prop (to block clicks while the usage check is in flight).
- **Watch Live Quick Link — Live Stream Indicator**
  - **Dynamic Card State**: When a YouTube broadcast is actually live (detected via `getLiveYoutubeBroadcast` and surfaced as `latestSermon.isLive` — the same signal the homepage "Watch Our Latest Sermon" section uses, independent of the admin's Show Live Banner toggle), the Watch Live card in [QuickActions.tsx](file:///c:/Users/techi/APPs/Stonehill/components/public/QuickActions.tsx) switches to a red gradient, replaces its description with "Streaming now," and shows a pulsing "LIVE" badge with a white radar dot (`animate-ping`) and an ARIA "Live stream currently active" status label.
  - **Soft Glow Animation**: Added a `pulse-glow` keyframe in [globals.css](file:///c:/Users/techi/APPs/Stonehill/app/globals.css) that animates only `box-shadow` (zero layout shift) and is gated on `prefers-reduced-motion: no-preference`. All other animations use the existing `motion-safe:` Tailwind variant.
  - **Default State Preserved**: When no broadcast is live, the card renders identically to its prior appearance — no badge, no animation, no color change.

## [0.5.3] - 2026-05-26

### Added
- **Leader Categories & Grouped Public Directory**
  - **CMS Management**: Added support for Leader Categories with dedicated CMS endpoints, custom drag-ordering, schema validation, and database helpers in [leaderCategories.ts](file:///c:/Users/techi/APPs/Stonehill/lib/data/leaderCategories.ts).
  - **Public Grouping**: Updated the public Leaders page [/our-leaders](file:///c:/Users/techi/APPs/Stonehill/app/(public)/our-leaders/page.tsx) to query leaders grouped dynamically by their Category, displaying them section-by-section using the customized category order.
- **Nested Rows Inside Sections (Page Builder)**
  - **Grid Layout Enhancements**: Introduced nested rows inside page builder sections to support multi-column layouts with granular height, custom padding, and order controls.
  - **Schema & Types**: Created validation logic and serialization utilities in [page-builder-rows.ts](file:///c:/Users/techi/APPs/Stonehill/lib/page-builder-rows.ts) and [pageBuilderSafety.ts](file:///c:/Users/techi/APPs/Stonehill/lib/pageBuilderSafety.ts).
- **New Page Builder Blocks (Gallery, Carousel, Countdown, Map, Icon/Image Box)**
  - **Media Gallery & Carousel**: Added configurable Gallery and Carousel blocks, including layout density, aspect ratio, image radius, border, and navigation styling.
  - **Countdown Block**: Added a Countdown block with target date/time fields, labels, text styling, and live countdown timer logic.
  - **Google Maps Integration**: Added a Google Map block to embed Google Maps using coordinates, address query, custom height, zoom, and border options.
  - **Icon/Image Box Block**: Implemented an Icon/Image Box block featuring image/icon styling controls (size, radius, border, shadow, and object-fit) for landing page layouts.
  - **H5/H6 Heading Levels**: Added support for H5 and H6 headings in heading/title blocks.
- **Optional Back Link & Hero Banner on Builder Pages**
  - **Navigation Header Controls**: Added configuration controls for builder-generated pages, allowing page authors to optionally show or hide a Back link or a Hero banner at the top of the page.
- **Smart Paragraph Paste Formatting**
  - **Preserved Line Breaks**: Configured paragraphs to preserve source line breaks (`white-space: pre-wrap`) when pasting text, avoiding merging multi-line copy into single blocks.

### Fixed
- **Page Builder Validation & SEO Counters**
  - **Field-level Error Feedback**: Implemented inline validation warning badges/borders and field-level validation errors inside the builder inspector.
  - **SEO Character Counters**: Added live character counters for page metadata title and description in the builder sidebar.

## [0.5.2] - 2026-05-24

### Added
- **Clickable Leader Cards & Details Modal**
  - **Interactivity Enhancements**: Converted [LeaderCard.tsx](file:///c:/Users/techi/APPs/Stonehill/components/public/LeaderCard.tsx) into a client component. Added a card lift transition effect (`hover:-translate-y-1 hover:shadow-lg`) and focus outline. Added an invisible overlay trigger button inside the card for seamless mouse and tab key click capture.
  - **Responsive Details Modal**: Implemented a responsive details modal using Headless UI `Dialog` and `Transition` with a backdrop blur overlay (`backdrop-blur-sm bg-slate-900/70`) and scale entrance animations.
  - **Preserved Circular Image Shape**: Styled the modal image container to perfectly match the card's circular frame and crop styling (`rounded-full overflow-hidden object-cover`) without stretching or distortion.
  - **A11y & Focus Control**: Configured full keyboard accessibility, including focus trapping inside the modal when open and focus restoration to the triggering card when closed.
- **Leaders Drag-and-Drop Reordering**
  - **CMS Panel ordering**: Enabled `@dnd-kit/sortable` row reordering for Leaders in the CMS admin panel list [CmsModuleList.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsModuleList.tsx).

### Fixed
- **Leader Creation Validation**
  - **Missing Active Field**: Added the missing `active` field to the Leaders CMS schema configuration in [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts) to resolve validation errors when creating new leaders.

## [0.5.1] - 2026-05-23

### Added
- **Navigation Menu Management System**
  - **Dynamic Navigation Control**: Implemented a comprehensive Header & Footer Navigation Menu Management dashboard in the CMS, supporting custom labels, URLs (internal routes or external pages), and target window settings (same tab vs new tab).
  - **System Defaults & Reset System**: Established baseline menu configurations in [defaultMenus.ts](file:///c:/Users/techi/APPs/Stonehill/lib/constants/defaultMenus.ts) and added a "Reset to Default" button with a confirmation modal in [MenuManager.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/menus/MenuManager.tsx). Reverts menus in Firestore and fires server-side revalidation actions.
  - **Dynamic Live Site Fallback**: Updated [PublicHeader.tsx](file:///c:/Users/techi/APPs/Stonehill/components/layout/PublicHeader.tsx) and [PublicFooter.tsx](file:///c:/Users/techi/APPs/Stonehill/components/layout/PublicFooter.tsx) to fetch menu configurations from Firestore dynamically and automatically fall back to the system defaults when none exist.
  - **Firestore Rules & Types**: Added security rules for the `/menus` collection in `firestore.rules` and validation schemas in [validators.ts](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts). Added the menus endpoint route in `AdminSidebar.tsx` and collection keys in `collections.ts`.
- **Button Block Padding Controls**
  - **Configurable Button Padding**: Extended Page Builder Button Block settings in [BuilderInspector.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/BuilderInspector.tsx) with a granular padding control panel (Top, Right, Bottom, Left).
  - **Link/Unlink & Reset Actions**: Added a button to lock/unlock all sides for uniform scaling and quick-reset action back to theme defaults (12px top/bottom, 24px left/right).
  - **Canvas & Live Render Integration**: Integrated padding style injection in [BlockRenderer.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/page-builder/BlockRenderer.tsx) and public [PageBuilderRenderer.tsx](file:///c:/Users/techi/APPs/Stonehill/components/shared/page-builder/PageBuilderRenderer.tsx).

### Fixed
- **Public Layout Header Heights & Section Overlaps**
  - **Overlap Padding Adjustment**: Added a `hasOverlap` parameter to [PageHero.tsx](file:///c:/Users/techi/APPs/Stonehill/components/public/PageHero.tsx) to increase hero height and shift content upward when standard sections use negative margins (`-mt-16 md:-mt-24`).
  - **Uniform Heights**: Fixed the layout height discrepancy on About, Sermons (details), Resources, Ministries (details), and Events (details) pages by passing `hasOverlap={true}` so that all page headers render with consistent height across the site.

## [0.5.0] - 2026-05-21

### Added
- **Ministries Module Enhancements**
  - **Open in New Tab Option**: Integrated an "Open in New Tab" checkbox for the Ministry CTA button URL inside [CmsConfig.ts](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsConfig.ts). Extended database schema validation (`ministrySchema` in [validators.ts](file:///c:/Users/techi/APPs/Stonehill/lib/validators.ts)), type definitions ([content.ts](file:///c:/Users/techi/APPs/Stonehill/types/content.ts)), and applied conditional `target="_blank" rel="noopener noreferrer"` attributes on the dynamic public Ministry details page button.
  - **SEO Description Character Counter**: Added a dynamic, real-time character counter under the `seoDescription` textarea field in [CmsModuleForm.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsModuleForm.tsx). Employs color warnings: slate-gray under 144 characters (90%), bold amber-600 warning from 144 to 160 characters, and bold red-600 error above 160 characters.
  - **Drag-and-Drop Ordering**: Enabled drag-and-drop row reordering for the Ministries admin table in [CmsModuleList.tsx](file:///c:/Users/techi/APPs/Stonehill/components/admin/cms/CmsModuleList.tsx), successfully reusing the robust `@dnd-kit/sortable` implementation. Fully customized list hint labels and toast success/error notifications to adapt dynamically to slides or ministries.

## [0.4.9] - 2026-05-20

### Fixed
- **Page Builder Media Resizing & Layout Reflow**
  - Implemented 60fps real-time visual column resizing in multi-column layouts by driving the active drag loop with inline CSS custom property overrides (`--col-width`) to bypass global `!important` stylesheet rules.
  - Added full proportional diagonal resizing (`se` corner handle) for image and video blocks while strictly preserving aspect ratio locks.
  - Fixed visual preview stretch/squish on active drag by scaling height along with width in real-time when aspect-ratio lock is active.
  - Mitigated image/video cropping by using `object-contain` for image wrappers and `aspect-video` for video frames, preventing framing issues during visual scaling.
  - Ensured seamless persistence of resized layouts (pixel height when unlocked, percentage width, dynamic columns) in serializable `builderData` for Firestore drafts.
  - Maintained complete compatibility with drag-and-drop (`dnd-kit`), mobile stacking rules, and block movement controls.
- **Public Rendering Stability & Error Boundaries**
  - Added recursive serialization verification in `lib/data/pages.ts` to fully strip nested Firestore `Timestamp` objects from `builderData` before crossing server/client component boundaries, eliminating production hydration build crashes.
  - Created a robust custom [error.tsx](file:///c:/Users/techi/APPs/Stonehill/app/(public)/error.tsx) error boundary for dynamic public routes, providing client diagnostics and safe UX fallback recovery options.

## [0.4.8] - 2026-05-18


### Added
- **Page Builder Pattern Library**
  - Created a centralized registry (`patternsCatalog`) of 12 branded page templates (Hero, About, Call To Action, Feature, General) matching the Stonehill design system.
  - Implemented `PatternPickerModal` to provide a visual interface for selecting templates.
  - Added deep-cloning and recursive ID regeneration in `PageBuilderContext` (`handleInsertTemplate`) to ensure no React key collisions when multiple templates are added to the canvas.
  - Integrated template insertion triggers into the `BuilderCanvas` interface.

## [0.4.7] - 2026-05-18

### Added
- **CMS Admin Navigation**
  - Added a "View Site" quick-link to the `AdminHeader` to allow administrators to easily open the main public-facing site in a new tab without leaving the CMS dashboard.
- **Hero Carousel Enhancements**
  - Enabled smooth automatic slide transitions using the `embla-carousel-autoplay` plugin (5-second default interval).
  - Configured auto-transition to seamlessly pause when a user hovers over the carousel and resume upon mouse leave.
  - Replaced the default lateral sliding animation with a premium, GPU-accelerated fade effect via `embla-carousel-fade`.
  - Manual left/right navigation arrows immediately reset the auto-transition timer to prevent unexpected early slide changes.

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
