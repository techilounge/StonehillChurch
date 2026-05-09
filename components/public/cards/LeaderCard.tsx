import React from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import { type z } from "zod";
import { leaderSchema } from "@/lib/validators";
import { Card, CardContent } from "@/components/shared/Card";

type Leader = z.infer<typeof leaderSchema>;

interface LeaderCardProps {
  leader: Leader;
}

export function LeaderCard({ leader }: LeaderCardProps) {
  return (
    <Card className="group overflow-hidden flex flex-col h-full text-center transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-stonehill-gold focus-within:ring-offset-2 border-transparent hover:border-stonehill-line bg-white/60 hover:bg-white">
      <CardContent className="flex-1 flex flex-col p-8 items-center">
        <div className="relative h-32 w-32 rounded-full overflow-hidden mb-6 ring-4 ring-stonehill-cream group-hover:ring-stonehill-gold transition-all duration-300">
          <Image
            src={leader.photoUrl}
            alt={leader.photoAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 128px, 128px"
          />
        </div>
        <h3 className="text-xl font-bold text-stonehill-ink mb-1">{leader.name}</h3>
        <p className="text-stonehill-evergreen font-medium mb-4">{leader.title}</p>
        <p className="text-stonehill-muted text-sm line-clamp-4 flex-1 mb-6">
          {leader.bio}
        </p>
        <div className="mt-auto">
          <a
            href={`mailto:${leader.email}`}
            className="inline-flex items-center text-sm font-semibold text-stonehill-muted hover:text-stonehill-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-gold rounded-sm px-2 py-1"
            aria-label={`Email ${leader.name}`}
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
