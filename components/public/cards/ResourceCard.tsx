import React from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { type z } from "zod";
import { resourceSchema } from "@/lib/validators";
import { Card, CardContent } from "@/components/shared/Card";

type Resource = z.infer<typeof resourceSchema>;

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const isExternal = !!resource.externalUrl;
  const href = resource.externalUrl || resource.fileUrl || "#";
  const Icon = isExternal ? ExternalLink : Download;

  return (
    <Card className="group overflow-hidden flex flex-col h-full transition-colors hover:border-stonehill-gold focus-within:ring-2 focus-within:ring-stonehill-gold focus-within:ring-offset-2">
      <CardContent className="flex-1 flex items-start p-6 gap-4">
        <div className="rounded-full bg-stonehill-cream p-3 flex-shrink-0 group-hover:bg-[#f2e7d3] transition-colors">
          <FileText className="h-6 w-6 text-stonehill-gold" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase text-stonehill-leaf mb-1 tracking-wider">
            {resource.category.replace("_", " ")}
          </div>
          <h3 className="text-lg font-bold text-stonehill-ink mb-2">
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="focus:outline-none"
            >
              <span className="absolute inset-0" aria-hidden="true" />
              {resource.title}
            </a>
          </h3>
          <p className="text-sm text-stonehill-muted line-clamp-2">
            {resource.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-stonehill-line group-hover:text-stonehill-evergreen transition-colors mt-1">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
