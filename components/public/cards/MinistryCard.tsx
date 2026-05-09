import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type z } from "zod";
import { ministrySchema } from "@/lib/validators";
import { Card, CardContent } from "@/components/shared/Card";

type Ministry = z.infer<typeof ministrySchema>;

interface MinistryCardProps {
  ministry: Ministry;
}

export function MinistryCard({ ministry }: MinistryCardProps) {
  return (
    <Card className="group overflow-hidden flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-stonehill-gold focus-within:ring-offset-2">
      <div className="relative h-56 w-full bg-stonehill-muted overflow-hidden">
        <Image
          src={ministry.imageUrl}
          alt={ministry.imageAlt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stonehill-ink/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        <h3 className="absolute bottom-4 left-6 text-2xl font-bold text-white tracking-tight">
          {ministry.name}
        </h3>
      </div>
      <CardContent className="flex-1 flex flex-col p-6">
        <p className="text-stonehill-muted line-clamp-3 mb-6 flex-1">
          {ministry.shortDescription}
        </p>
        <div className="mt-auto">
          <Link 
            href={`/ministries/${ministry.slug}`} 
            className="inline-flex items-center text-sm font-semibold text-stonehill-evergreen hover:text-stonehill-forest transition-colors focus:outline-none focus-visible:underline"
          >
            <span className="absolute inset-0" aria-hidden="true" />
            Learn more
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
