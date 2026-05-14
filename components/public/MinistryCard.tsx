import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Serialized } from "@/lib/data/utils";
import { Ministry } from "@/types/content";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/shared/Card";

interface MinistryCardProps {
  ministry: Serialized<Ministry>;
}

export function MinistryCard({ ministry }: MinistryCardProps) {
  return (
    <Link
      href={`/ministries/${ministry.slug}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
    >
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300">
        <div className="relative h-48 w-full bg-slate-50 overflow-hidden">
          {ministry.imageUrl ? (
            <Image
              src={ministry.imageUrl}
              alt={ministry.imageAlt || ministry.name}
              fill
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500/50">
              <Users className="w-12 h-12" />
            </div>
          )}
        </div>

        <CardContent className="p-6 flex flex-col flex-grow text-center items-center">
          <h3 className="text-xl font-bold font-display text-slate-900 mb-3 group-hover:text-stonehill-primary transition-colors">
            {ministry.name}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-3 mb-4">
            {ministry.shortDescription}
          </p>
          <span className="mt-auto text-stonehill-primary font-semibold text-sm hover:underline">
            Learn More
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
