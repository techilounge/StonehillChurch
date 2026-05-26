export const collections = {
  users: "users",
  homepageSlides: "homepageSlides",
  sermons: "sermons",
  events: "events",
  ministries: "ministries",
  leaders: "leaders",
  leaderCategories: "leaderCategories",
  announcements: "announcements",
  resources: "resources",
  mediaAssets: "mediaAssets",
  formSubmissions: "formSubmissions",
  userInvites: "userInvites",
  siteSettings: "siteSettings",
  pages: "pages",
  popups: "popups",
  youtubeSettings: "youtubeSettings",
  auditLogs: "auditLogs",
  menus: "menus",
} as const;

export type CollectionKey = keyof typeof collections;
export type CollectionName = (typeof collections)[CollectionKey];

export const APPROVED_COLLECTION_NAMES = [
  collections.users,
  collections.homepageSlides,
  collections.sermons,
  collections.events,
  collections.ministries,
  collections.leaders,
  collections.leaderCategories,
  collections.announcements,
  collections.resources,
  collections.mediaAssets,
  collections.formSubmissions,
  collections.userInvites,
  collections.siteSettings,
  collections.pages,
  collections.popups,
  collections.youtubeSettings,
  collections.auditLogs,
  collections.menus,
] as const satisfies readonly CollectionName[];

export const SINGLETON_DOCS = {
  youtubeSettings: "default",
} as const;
