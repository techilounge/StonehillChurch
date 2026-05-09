import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getBulletins } from "@/lib/data/resources";
import { FileText, Download, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Church Bulletin | Stonehill Church",
  description: "Download the weekly church bulletin for Stonehill Church.",
};

export default async function ChurchBulletinPage() {
  const bulletins = await getBulletins();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Church Bulletin"
        subtitle="Stay updated with our weekly announcements and order of service."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {bulletins.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
              <h2 className="text-2xl font-bold font-serif mb-8 text-stone-900 border-b border-stone-100 pb-4">Recent Bulletins</h2>
              
              <div className="space-y-4">
                {bulletins.map((bulletin) => (
                  <div key={bulletin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-100">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="bg-primary/10 p-3 rounded-full text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-lg">{bulletin.title}</h3>
                        {bulletin.description && <p className="text-sm text-stone-500">{bulletin.description}</p>}
                        {bulletin.createdAt && (
                          <p className="text-xs text-stone-400 mt-1">
                            Added: {new Date(bulletin.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      {bulletin.fileUrl && (
                        <a 
                          href={bulletin.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
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
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
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
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-stone-100">
              <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-serif text-stone-900 mb-2">No Bulletins Available</h3>
              <p className="text-stone-600">Please check back later for the latest weekly bulletin.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
