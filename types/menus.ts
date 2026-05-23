import type { FirestoreTimestampLike } from "./shared";

export type MenuLocation = "header" | "footer";

export type MenuItem = {
  id: string;
  label: string;
  url: string;
  openInNewTab: boolean;
  children: MenuItem[];
};

export type MenuDocument = {
  location: MenuLocation;
  items: MenuItem[];
  updatedAt: FirestoreTimestampLike;
  updatedBy: string | null;
};
