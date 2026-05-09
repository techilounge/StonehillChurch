export const FIRESTORE_COLLECTIONS = {
  users: "users",
  homepageSlides: "homepageSlides",
  sermons: "sermons",
  events: "events",
  ministries: "ministries",
  leaders: "leaders",
  announcements: "announcements",
  resources: "resources",
  mediaAssets: "mediaAssets",
  formSubmissions: "formSubmissions",
  siteSettings: "siteSettings",
  pages: "pages",
  youtubeSettings: "youtubeSettings",
  auditLogs: "auditLogs",
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

