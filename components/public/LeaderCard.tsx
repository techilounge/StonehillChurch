import React from "react";
import Image from "next/image";
import { Serialized } from "@/lib/data/utils";
import { Leader } from "@/types/content";
import { User, Mail } from "lucide-react";

interface LeaderCardProps {
  leader: Serialized<Leader>;
}

export function LeaderCard({ leader }: LeaderCardProps) {
  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-300 items-center text-center p-6">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-stone-100 mb-4 ring-4 ring-stone-50">
        {leader.photoUrl ? (
          <Image
            src={leader.photoUrl}
            alt={leader.photoAlt || leader.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <User className="w-12 h-12" />
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold font-serif text-stone-900 mb-1">
        {leader.name}
      </h3>
      <p className="text-primary font-medium text-sm mb-4 uppercase tracking-wider">
        {leader.title}
      </p>

      {leader.bio && (
        <p className="text-stone-600 text-sm mb-6 leading-relaxed line-clamp-4">
          {leader.bio}
        </p>
      )}

      {leader.email && (
        <a
          href={`mailto:${leader.email}`}
          className="mt-auto inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          Contact
        </a>
      )}
    </div>
  );
}
