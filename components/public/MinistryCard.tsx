import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Serialized } from "@/lib/data/utils";
import { Ministry } from "@/types/content";
import { Users } from "lucide-react";

interface MinistryCardProps {
  ministry: Serialized<Ministry>;
}

export function MinistryCard({ ministry }: MinistryCardProps) {
  return (
    <Link
      href={`/ministries/${ministry.slug}`}
      className="group flex flex-col bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        {ministry.imageUrl ? (
          <Image
            src={ministry.imageUrl}
            alt={ministry.imageAlt || ministry.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <Users className="w-12 h-12" />
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow text-center items-center">
        <h3 className="text-xl font-bold font-serif text-stone-900 mb-3 group-hover:text-primary transition-colors">
          {ministry.name}
        </h3>
        <p className="text-stone-600 text-sm line-clamp-3 mb-4">
          {ministry.shortDescription}
        </p>
        <span className="mt-auto text-primary font-semibold text-sm hover:underline">
          Learn More
        </span>
      </div>
    </Link>
  );
}
