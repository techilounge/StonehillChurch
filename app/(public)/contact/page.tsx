import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { LocationMapSection } from "@/components/public/LocationMapSection";
import { ContactForm } from "@/components/forms/public/ContactForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "contact",
    title: "Contact Us",
    description: "Get in touch with Stonehill SDA Church. Find our address, phone number, email, and service times.",
    path: "/contact",
    noIndexFollow: true,
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const address = settings["contact.address"] || "1487 Stonehill Ridge Road, Spokane, WA 99203";
  const phone = settings["contact.phone"] || "+1-509-555-0117";
  const email = settings["contact.email"] || "office@stonehillsda.org";
  const breakfastServiceTime = settings["service_times.breakfast_service"] || "Saturdays · 9:00am";
  const sabbathSchoolTime = settings["service_times.sabbath_school"] || "Saturdays · 10:00am";
  const worshipServiceTime =
    settings["service_times.divine_worship"] ||
    settings["service_times.worship_service"] ||
    "Saturdays · 11:00am";
  const prayerMeetingTime = settings["service_times.prayer_meeting"] || "Wednesdays · 7:00pm";
  const serviceTimes = `Breakfast Service: ${breakfastServiceTime}\nSabbath School: ${sabbathSchoolTime}\n\nDivine Worship: ${worshipServiceTime}\nPrayer Meeting: ${prayerMeetingTime}`;

  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you. Get in touch with our team."
      />

      <section className="py-16 md:py-24 overflow-hidden border-b border-stonehill-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-8 text-stonehill-evergreen">Get in Touch</h2>
              <p className="text-lg text-stonehill-ink/80 mb-10 leading-relaxed max-w-lg">
                Whether you have a question about our ministries, need prayer, or just want to say hello, we are here for you.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="bg-stonehill-evergreen/10 p-4 rounded-full text-stonehill-evergreen shrink-0 ring-1 ring-stonehill-line">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-stonehill-ink mb-1">Visit Us</h3>
                    <p className="text-stonehill-ink/80 whitespace-pre-wrap">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="bg-stonehill-evergreen/10 p-4 rounded-full text-stonehill-evergreen shrink-0 ring-1 ring-stonehill-line">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-stonehill-ink mb-1">Call Us</h3>
                    <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="text-stonehill-ink/80 hover:text-stonehill-evergreen hover:underline transition-colors block mt-1">
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="bg-stonehill-evergreen/10 p-4 rounded-full text-stonehill-evergreen shrink-0 ring-1 ring-stonehill-line">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-stonehill-ink mb-1">Email Us</h3>
                    <a href={`mailto:${email}`} className="text-stonehill-ink/80 hover:text-stonehill-evergreen hover:underline transition-colors block mt-1">
                      {email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="bg-stonehill-evergreen/10 p-4 rounded-full text-stonehill-evergreen shrink-0 ring-1 ring-stonehill-line">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-stonehill-ink mb-1">Service Times</h3>
                    <p className="text-stonehill-ink/80 whitespace-pre-wrap leading-relaxed mt-1">{serviceTimes}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-stonehill-line mt-10">
                <h3 className="text-xl font-bold tracking-tight text-stonehill-evergreen mb-4">Member Resources</h3>
                <div className="flex flex-col gap-3">
                  <Link href="/maintenance-request" className="text-stonehill-ink hover:text-stonehill-evergreen font-medium transition-colors">
                    Submit a Maintenance Request &rarr;
                  </Link>
                  <Link href="/membership-transfer" className="text-stonehill-ink hover:text-stonehill-evergreen font-medium transition-colors">
                    Transfer Your Membership &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stonehill-line">
              <h2 className="text-2xl font-bold tracking-tight mb-6 text-stonehill-evergreen border-b border-stonehill-line pb-4">Send a Message</h2>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <LocationMapSection settings={settings} />
    </main>
  );
}
