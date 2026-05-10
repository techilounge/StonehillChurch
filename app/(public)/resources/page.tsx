import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getResources } from "@/lib/data/resources";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { FileText, Download, ExternalLink } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "resources",
    title: "Resources",
    description: "Access church resources, documents, study guides, and forms.",
    path: "/resources",
  });
}

export default async function ResourcesPage() {
  const resources = await getResources();

  // Optionally group resources by category
  const groupedResources = resources.reduce((acc, resource) => {
    const cat = resource.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  const categories = Object.keys(groupedResources).sort();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Resources"
        subtitle="Documents, study guides, forms, and more."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          {resources.length > 0 ? (
            <div className="space-y-12">
              {categories.map((category) => (
                <div key={category}>
                  <h2 className="text-2xl font-bold font-serif mb-6 text-stone-900 capitalize border-b border-stone-200 pb-2">
                    {category.replace("_", " ")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedResources[category].map((resource) => (
                      <div key={resource.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold font-serif text-stone-900 text-lg leading-tight mb-1">{resource.title}</h3>
                            <p className="text-sm text-stone-500 line-clamp-2">{resource.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-4 flex gap-3">
                          {resource.fileUrl && (
                            <a 
                              href={resource.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 px-4 rounded-xl text-sm font-medium transition-colors"
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
                              className="flex-1 flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 px-4 rounded-xl text-sm font-medium transition-colors"
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
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-stone-100">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-lg text-stone-600">No resources are currently available.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
