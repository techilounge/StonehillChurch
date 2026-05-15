import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { getResources } from "@/lib/data/resources";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { FileText, Download, ExternalLink, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, siteSettingsToSeoSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "resources",
    title: "Resources",
    description: "Access church resources, documents, study guides, and forms.",
    path: "/resources",
  });
}

export default async function ResourcesPage() {
  const [resources, siteSettings] = await Promise.all([
    getResources(),
    getSiteSettings()
  ]);
  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  // Optionally group resources by category
  const groupedResources = resources.reduce((acc, resource) => {
    const cat = resource.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  const categories = Object.keys(groupedResources).sort();

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
          ],
          seoSettings.siteUrl,
        )}
      />
      <PageHero
        title="Resources"
        subtitle="Documents, study guides, forms, and more."
      />

      <section className="py-16 md:py-24 overflow-hidden -mt-16 md:-mt-24 relative z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Back Link */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-slate-900/60 hover:text-stonehill-accent font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          {resources.length > 0 ? (
            <div className="space-y-16">
              {categories.map((category) => (
                <div key={category}>
                  <h2 className="text-2xl font-bold tracking-tight mb-8 text-stonehill-primary capitalize border-b border-slate-200 pb-4">
                    {category.replace("_", " ")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groupedResources[category].map((resource) => (
                      <div key={resource.id} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="bg-stonehill-primary/10 p-3 rounded-full text-stonehill-primary shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold tracking-tight text-slate-900 text-xl leading-tight mb-2">{resource.title}</h3>
                            <p className="text-sm text-slate-900/80 line-clamp-2">{resource.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-4 flex gap-3">
                          {resource.fileUrl && (
                            <a 
                              href={resource.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-stonehill-accent/20 text-slate-900 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          )}
                          {resource.externalUrl && (
                            <a 
                              href={resource.externalUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-stonehill-accent/20 text-slate-900 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Link
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">No Resources Available</h2>
              <p className="text-lg text-slate-900/80 leading-relaxed mb-8">
                We are currently organizing our resource library. Please check back later for documents, study guides, and forms.
              </p>
            </div>
          )}
        </div>
      </section>
      
      <section className="py-16 bg-white border-t border-slate-200 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary">Looking for something specific?</h2>
          <p className="text-slate-900/80 text-lg max-w-2xl mx-auto">
            If you need a specific form or document that isn't listed here, please contact the church office for assistance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Contact Office
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
