import React from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export function WelcomeSection() {
  return (
    <section className="overflow-hidden bg-stonehill-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-2 lg:gap-x-16 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stonehill-evergreen sm:text-4xl">
              Welcome to Stonehill SDA Church
            </h2>
            <p className="mt-4 text-lg leading-8 text-stonehill-ink/80">
              We are a Seventh-day Adventist community dedicated to sharing the love of Jesus. 
              Whether you are looking for a church home, seeking answers, or simply want to 
              visit, you are welcome here.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/plan-your-visit" className={cn(buttonVariants({ size: "lg" }))}>
                Plan Your Visit
              </Link>
              <Link href="/about" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Learn More About Us
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/placeholder-welcome.svg"
              alt="Stonehill SDA Church Community"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
