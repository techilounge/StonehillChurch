import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/data/pages";
import { PageBuilderRenderer } from "@/components/shared/page-builder/PageBuilderRenderer";

export const revalidate = 60; // optionally cache for 60 seconds

// Builder page slugs live in Firestore and aren't known at build time, so this
// route renders on demand. An explicit (empty) generateStaticParams is still
// required: without it, the production build fails to generate the client
// reference manifest for the static sibling pages in this (public) route group
// ("Invariant: Expected clientReferenceManifest to be defined").
export function generateStaticParams() {
  return [];
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  // If page doesn't have builder data but has content, render simple HTML
  if (!page.builderData || !page.builderData.sections) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-4xl font-bold mb-6 font-display text-stonehill-primary">{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.content || "" }} />
      </div>
    );
  }

  return (
    <main>
      <PageBuilderRenderer document={page.builderData} />
    </main>
  );
}

// Generate metadata dynamically
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return {
      title: "Page Not Found | Stonehill Church",
    };
  }

  return {
    title: page.seoTitle ? `${page.seoTitle} | Stonehill Church` : `${page.title} | Stonehill Church`,
    description: page.seoDescription || "",
  };
}
