"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

interface LocationMapSectionProps {
  settings?: Record<string, any>;
}

export function LocationMapSection({ settings = {} }: LocationMapSectionProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Defaults fallback
  const address = settings["contact.address"] || "123 Stonehill Way, Cityville, ST 12345";
  const phone = settings["contact.phone"] || "(555) 123-4567";
  const email = settings["contact.email"] || "info@stonehillchurch.org";
  const mapUrl = settings["contact.google_maps_url"] || "https://maps.google.com";

  // If we had a Google Maps Embed API key, we could load it here on demand.
  // For now, we will use an image fallback or a button to open in maps.
  
  return (
    <section className="py-16 bg-stonehill-evergreen text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Location & Service Times
              </h2>
              <p className="text-lg text-white/80">
                We'd love to have you worship with us. Join us this weekend.
              </p>
            </div>

            <div className="space-y-6 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
              <div className="flex items-start">
                <MapPin className="w-6 h-6 mr-4 text-stonehill-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg">Address</h3>
                  <p className="text-white/80 mt-1">{address}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-6 h-6 mr-4 text-stonehill-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg">Service Times</h3>
                  <div className="text-white/80 mt-1 space-y-1">
                    <p>Sabbath School: 9:30 AM</p>
                    <p>Worship Service: 11:00 AM</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="w-6 h-6 mr-4 text-stonehill-gold flex-shrink-0" />
                <p className="text-white/80">{phone}</p>
              </div>

              <div className="flex items-center">
                <Mail className="w-6 h-6 mr-4 text-stonehill-gold flex-shrink-0" />
                <a href={`mailto:${email}`} className="text-white/80 hover:text-white hover:underline transition-all">
                  {email}
                </a>
              </div>
            </div>

            <div>
              <a 
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "bg-stonehill-gold text-stonehill-ink hover:bg-stonehill-gold/90 border-none")}
              >
                Get Directions
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>

          {/* Interactive Map Lazy Load Area */}
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            {!mapLoaded ? (
              <div className="text-center p-6">
                <MapPin className="w-12 h-12 mx-auto text-white/40 mb-4" />
                <h3 className="text-xl font-medium text-white/80 mb-4">View Interactive Map</h3>
                <button 
                  onClick={() => setMapLoaded(true)}
                  className={cn(buttonVariants({ variant: "outline" }), "bg-white/10 text-white border-white/20 hover:bg-white/20")}
                >
                  Load Map
                </button>
              </div>
            ) : (
              <iframe
                title="Google Maps Location"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            )}
          </div>
          
        </div>
      </div>
    </section>
  );
}
