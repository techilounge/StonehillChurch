import React from "react";
import Link from "next/link";
import { Heart, MessageSquare, HandHeart, Megaphone } from "lucide-react";

export function ConnectSection() {
  const cards = [
    {
      title: "Prayer Request",
      description: "We believe in the power of prayer. Let our team pray for your specific needs this week.",
      href: "/prayer-request",
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      title: "Contact Us",
      description: "Have a question or need to get in touch with our pastoral staff? Reach out to us.",
      href: "/contact",
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Volunteer",
      description: "Discover your spiritual gifts and find a place to serve in one of our active ministries.",
      href: "/volunteer",
      icon: HandHeart,
      color: "text-stonehill-primary",
      bgColor: "bg-stonehill-primary/10"
    },
    {
      title: "Submit Announcement",
      description: "Have an event or news to share with the church family? Submit it for the bulletin.",
      href: "/submit-announcement",
      icon: Megaphone,
      color: "text-stonehill-accent",
      bgColor: "bg-stonehill-accent/10"
    }
  ];

  return (
    <section className="py-16 bg-white sm:py-24 border-t border-slate-200 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl">
            Let&apos;s Connect
          </h2>
          <p className="mt-4 text-lg text-slate-900/80">
            We&apos;re here for you. Whether you need prayer, want to serve, or just have a question, 
            we&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Link 
              key={card.title}
              href={card.href}
              className="group relative flex flex-col p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-stonehill-accent overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
            >
              <div className={`inline-flex items-center justify-center p-3 rounded-xl mb-4 w-12 h-12 ${card.bgColor} ${card.color} motion-safe:transition-transform motion-safe:group-hover:scale-110`}>
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-stonehill-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-slate-900/70">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
