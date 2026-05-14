import React from "react";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CTASectionProps {
  title: string;
  subtitle?: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  className?: string;
}

export function CTASection({
  title,
  subtitle,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  className
}: CTASectionProps) {
  return (
    <section className={cn("bg-stonehill-primary text-white py-20", className)}>
      <Container className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{title}</h2>
        {subtitle && <p className="text-stonehill-secondary text-lg md:text-xl max-w-2xl mx-auto mb-8">{subtitle}</p>}
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" variant="primary">
            <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
          </Button>
          {secondaryCtaLabel && secondaryCtaHref && (
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10 hover:text-white">
              <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
}
