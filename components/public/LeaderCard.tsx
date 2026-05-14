import React from "react";
import Image from "next/image";
import { Serialized } from "@/lib/data/utils";
import { Leader } from "@/types/content";
import { User, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/shared/Card";

interface LeaderCardProps {
  leader: Serialized<Leader>;
}

export function LeaderCard({ leader }: LeaderCardProps) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-300 focus-within:ring-2 focus-within:ring-stonehill-accent focus-within:ring-offset-2">
      <CardContent className="flex flex-col items-center text-center p-6 h-full">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-50 mb-4 ring-4 ring-slate-50">
          {leader.photoUrl ? (
            <Image
              src={leader.photoUrl}
              alt={leader.photoAlt || leader.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500/50">
              <User className="w-12 h-12" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-1">
          {leader.name}
        </h3>
        <p className="text-stonehill-primary font-medium text-sm mb-4 uppercase tracking-wider">
          {leader.title}
        </p>

        {leader.bio && (
          <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-4">
            {leader.bio}
          </p>
        )}

        {leader.email && (
          <a
            href={`mailto:${leader.email}`}
            className="mt-auto inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-slate-50 hover:bg-stonehill-accent/20 text-slate-900 rounded-lg transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
          >
            <Mail className="w-4 h-4" />
            Contact
          </a>
        )}
      </CardContent>
    </Card>
  );
}
