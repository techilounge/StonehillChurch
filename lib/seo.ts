import type { Metadata } from "next";

type SeoConfig = {
  title: string;
  description: string;
  path?: string;
};

export function createMetadata({ title, description, path = "/" }: SeoConfig): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
    },
  };
}
