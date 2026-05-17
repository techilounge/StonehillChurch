import type { ContentStatus, FirestoreTimestampLike } from "./shared";

export type PopupMediaType = "image" | "video";

export type PopupVideoSource = "youtube" | "vimeo" | "url";

export type PopupAnimationStyle = "fade" | "scale" | "fade-scale";

export type PopupBackdropStyle = "solid" | "blur" | "gradient";

export type PopupWidthPreset = "auto" | "small" | "medium" | "large";

export type PopupHeightPreset = "auto" | "fit" | "scroll";

export type PopupTriggerType = "image" | "button" | "link";

export type PopupCaptionAlignment = "left" | "center" | "right";

export type PopupFrequencyMode = "every" | "once" | "interval";

export type PopupFrequencyIntervalUnit = "minutes" | "hours" | "days";

export const POPUP_FREQUENCY_MODES: PopupFrequencyMode[] = ["every", "once", "interval"];

export const POPUP_FREQUENCY_INTERVAL_UNITS: PopupFrequencyIntervalUnit[] = [
  "minutes",
  "hours",
  "days",
];

export const POPUP_ANIMATION_STYLES: PopupAnimationStyle[] = [
  "fade",
  "scale",
  "fade-scale",
];

export const POPUP_BACKDROP_STYLES: PopupBackdropStyle[] = [
  "solid",
  "blur",
  "gradient",
];

export const POPUP_WIDTH_PRESETS: PopupWidthPreset[] = [
  "auto",
  "small",
  "medium",
  "large",
];

export const POPUP_HEIGHT_PRESETS: PopupHeightPreset[] = [
  "auto",
  "fit",
  "scroll",
];

export const POPUP_TRIGGER_TYPES: PopupTriggerType[] = [
  "image",
  "button",
  "link",
];

export const POPUP_CAPTION_ALIGNMENTS: PopupCaptionAlignment[] = [
  "left",
  "center",
  "right",
];

export type Popup = {
  title: string;
  mediaType: PopupMediaType;
  // Image source: a URL to an uploaded mediaAsset, OR an external image URL.
  imageUrl: string | null;
  imageAlt: string | null;
  // Video source: either a YouTube/Vimeo URL, a hosted MP4 URL, or empty.
  videoUrl: string | null;
  videoAutoplay: boolean;
  videoMuted: boolean;
  videoLoop: boolean;
  videoMaintain16x9: boolean;
  // Scheduling window. Empty `startTime` = active immediately on publish.
  // Empty `endTime` = never expires.
  startTime: FirestoreTimestampLike | null;
  endTime: FirestoreTimestampLike | null;
  // Behavior
  animationStyle: PopupAnimationStyle;
  animationDurationMs: number;
  backdropStyle: PopupBackdropStyle;
  backdropOpacity: number; // 0-1 for solid; 0-1 for gradient end opacity
  backdropBlur: number; // px, for blur backdrop
  // Size
  widthPreset: PopupWidthPreset;
  heightPreset: PopupHeightPreset;
  // Trigger element rendered on the public site
  triggerType: PopupTriggerType;
  triggerLabel: string | null;
  // Caption
  captionText: string | null;
  captionShow: boolean;
  captionAlignment: PopupCaptionAlignment;
  // Frequency: how often a visitor should see this popup.
  // "every"    – fire on every qualifying trigger (no persistence).
  // "once"     – fire once per visitor, persisted in localStorage.
  // "interval" – fire, then cool down for intervalValue × intervalUnit.
  frequencyMode: PopupFrequencyMode;
  frequencyIntervalValue: number | null;
  frequencyIntervalUnit: PopupFrequencyIntervalUnit | null;
  // Lifecycle
  status: ContentStatus;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
  publishedAt: FirestoreTimestampLike | null;
  createdBy: string | null;
  updatedBy: string | null;
};
