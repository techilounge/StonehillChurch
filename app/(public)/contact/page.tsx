import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { LocationMapSection } from "@/components/public/LocationMapSection";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Stonehill Church",
  description: "Get in touch with Stonehill Church. Find our address, phone number, email, and service times.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you. Get in touch with our team."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold font-serif mb-8 text-stone-900">Get in Touch</h2>
              <p className="text-lg text-stone-600 mb-10 leading-relaxed">
                Whether you have a question about our ministries, need prayer, or just want to say hello, we are here for you.
              </p>

              <div className="space-y-8">
                {settings?.address && (
                  <div className="flex items-start gap-5">
                    <div className="bg-primary/10 p-4 rounded-full text-primary shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-stone-900 mb-1">Visit Us</h3>
                      <p className="text-stone-600 whitespace-pre-wrap">{settings.address}</p>
                    </div>
                  </div>
                )}

                {settings?.phone && (
                  <div className="flex items-start gap-5">
                    <div className="bg-primary/10 p-4 rounded-full text-primary shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-stone-900 mb-1">Call Us</h3>
                      <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="text-stone-600 hover:text-primary transition-colors">
                        {settings.phone}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.email && (
                  <div className="flex items-start gap-5">
                    <div className="bg-primary/10 p-4 rounded-full text-primary shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-stone-900 mb-1">Email Us</h3>
                      <a href={`mailto:${settings.email}`} className="text-stone-600 hover:text-primary transition-colors">
                        {settings.email}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.serviceTimes && (
                  <div className="flex items-start gap-5">
                    <div className="bg-primary/10 p-4 rounded-full text-primary shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-stone-900 mb-1">Service Times</h3>
                      <p className="text-stone-600 whitespace-pre-wrap">{settings.serviceTimes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Form Placeholder (Phase 13) */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-stone-100">
              <h2 className="text-2xl font-bold font-serif mb-6 text-stone-900">Send a Message</h2>
              
              <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-64">
                <Mail className="w-12 h-12 text-stone-300 mb-4" />
                <p className="text-stone-500 font-medium italic">
                  [ Contact Form will be available in a future update ]<br/>
                  For now, please email us directly at <a href={`mailto:${settings?.email || 'contact@stonehillchurch.org'}`} className="text-primary hover:underline">{settings?.email || 'contact@stonehillchurch.org'}</a>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <LocationMapSection />
    </main>
  );
}
