import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getBulletins } from "@/lib/data/resources";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { FileText, Download, ExternalLink } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "church-bulletin",
    title: "Church Bulletin",
    description: "Download the weekly church bulletin for Stonehill SDA Church.",
    path: "/church-bulletin",
  });
}

export default async function ChurchBulletinPage() {
  const bulletins = await getBulletins();

  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream pb-24">
      <PageHero
        title="Church Bulletin"
        subtitle="Stay updated with our weekly announcements and order of service."
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {bulletins.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-stonehill-line p-8 md:p-10">
              <h2 className="text-2xl font-bold tracking-tight mb-8 text-stonehill-evergreen border-b border-stonehill-line pb-4">Recent Bulletins</h2>
              
              <div className="space-y-6">
                {bulletins.map((bulletin) => (
                  <div key={bulletin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-stonehill-cream rounded-2xl border border-stonehill-line hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className="bg-white p-3 rounded-full text-stonehill-evergreen ring-1 ring-stonehill-line shadow-sm shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold tracking-tight text-stonehill-ink text-xl mb-1">{bulletin.title}</h3>
                        {bulletin.description && <p className="text-sm text-stonehill-ink/80 mb-2">{bulletin.description}</p>}
                        {bulletin.createdAt && (
                          <p className="text-xs font-medium text-stonehill-muted uppercase tracking-wide">
                            Added: {new Date(bulletin.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 w-full sm:w-auto">
                      {bulletin.fileUrl && (
                        <a 
                          href={bulletin.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-stonehill-line hover:bg-stonehill-gold/20 text-stonehill-ink py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                      {bulletin.externalUrl && (
                        <a 
                          href={bulletin.externalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-stonehill-line hover:bg-stonehill-gold/20 text-stonehill-ink py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-stonehill-line px-4">
              <div className="w-20 h-20 bg-stonehill-evergreen/10 text-stonehill-evergreen rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-stonehill-ink mb-3">No Bulletins Available</h3>
              <p className="text-stonehill-ink/80 text-lg max-w-md mx-auto">Please check back later for the latest weekly bulletin and announcements.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
