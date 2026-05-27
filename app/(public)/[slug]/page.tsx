import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPageBySlug } from "@/lib/data/pages";
import { isValidSafeUrl } from "@/lib/pageBuilderSafety";
import { PageHero } from "@/components/public/PageHero";
import { PageBuilderRenderer } from "@/components/shared/page-builder/PageBuilderRenderer";

// Builder pages read per-request data from Firestore and render inside the
// dynamic (public) layout, so this route must be rendered dynamically.
// Configuring it as static (revalidate + static generation) crashes at runtime
// with "DYNAMIC_SERVER_USAGE".
export const dynamic = "force-dynamic";

// generateStaticParams stays declared even though the route is dynamic:
// without it, the production build fails with "Invariant: Expected
// clientReferenceManifest to be defined" for the static sibling pages in this
// (public) route group.
export function generateStaticParams() {
  return [];
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  // Optional dark-navy hero banner at the very top of the page, matching the
  // hardcoded /about and /our-beliefs pattern.
  const safeHeroImage = page.heroImageUrl && isValidSafeUrl(page.heroImageUrl)
    ? page.heroImageUrl
    : undefined;
  const hero = page.heroEnabled ? (
    <PageHero
      title={page.title}
      subtitle={page.heroSubtitle || undefined}
      imageUrl={safeHeroImage}
    />
  ) : null;

  // Optional "Back to ..." link rendered above the page content. The URL is
  // sanitized via isValidSafeUrl so a malicious value can never produce a
  // working javascript:/data: link, falling back to the home page instead.
  const backLinkEnabled = !!page.backLinkEnabled;
  const backLinkLabel = (page.backLinkLabel || "Back to Home").slice(0, 80);
  const backLinkHref = page.backLinkHref && isValidSafeUrl(page.backLinkHref)
    ? page.backLinkHref
    : "/";
  const backLink = backLinkEnabled ? (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <Link
        href={backLinkHref}
        className="inline-flex items-center gap-2 text-slate-900/60 hover:text-stonehill-accent font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLinkLabel}
      </Link>
    </div>
  ) : null;

  // If page doesn't have builder data but has content, render simple HTML
  if (!page.builderData || !page.builderData.sections) {
    return (
      <>
        {hero}
        {backLink}
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
          <h1 className="text-4xl font-bold mb-6 font-display text-stonehill-primary">{page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.content || "" }} />
        </div>
      </>
    );
  }

  return (
    <main>
      {hero}
      {backLink}
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
