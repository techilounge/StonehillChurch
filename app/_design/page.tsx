import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { SelectInput } from "@/components/forms/SelectInput";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { SermonCard } from "@/components/public/SermonCard";
import { AnnouncementBanner } from "@/components/public/AnnouncementBanner";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHero } from "@/components/public/PageHero";
import { HeroCarousel } from "@/components/public/HeroCarousel";

export default function DesignShowcase() {
  return (
    <div className="min-h-screen bg-stonehill-cream/20">
      <AnnouncementBanner
        title="Welcome to the Design System Showcase!"
        message="Core components and states for Stonehill."
        priority="normal"
        ctaHref="#"
        ctaLabel="Read more"
      />
      <Container className="py-12 space-y-16">
        <div>
          <SectionHeader title="Typography & Colors" subtitle="Core brand tokens" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="h-24 rounded-lg bg-stonehill-evergreen flex items-end p-4 text-white font-bold">Evergreen</div>
            <div className="h-24 rounded-lg bg-stonehill-forest flex items-end p-4 text-white font-bold">Forest</div>
            <div className="h-24 rounded-lg bg-stonehill-gold flex items-end p-4 text-stonehill-ink font-bold">Gold</div>
            <div className="h-24 rounded-lg bg-stonehill-cream flex items-end p-4 text-stonehill-ink font-bold border border-stonehill-line">Cream</div>
          </div>
        </div>

        <div>
          <SectionHeader title="Buttons" subtitle="All button variants" />
          <div className="mt-8 flex flex-wrap gap-4">
            <Button variant="default">Default Button</Button>
            <Button variant="primary">Primary (Gold)</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link Style</Button>
          </div>
        </div>

        <div>
          <SectionHeader title="Badges" />
          <div className="mt-8 flex flex-wrap gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>

        <div>
          <SectionHeader title="Forms" subtitle="Input primitives" />
          <Card className="mt-8 p-6 max-w-xl">
            <form className="space-y-6">
              <FormField label="Full Name" description="Enter your first and last name" id="name">
                <TextInput id="name" placeholder="John Doe" />
              </FormField>
              
              <FormField label="Email Address" error="Email is required" id="email">
                <TextInput id="email" type="email" placeholder="john@example.com" hasError />
              </FormField>

              <FormField label="Inquiry Type" id="type">
                <SelectInput id="type">
                  <option>General Question</option>
                  <option>Prayer Request</option>
                  <option>Bible Study</option>
                </SelectInput>
              </FormField>

              <FormField label="Message" id="message">
                <TextArea id="message" placeholder="How can we help you?" />
              </FormField>

              <CheckboxField
                label="Subscribe to Newsletter"
                description="Get weekly updates on sermons and events."
                id="subscribe"
              />

              <Button type="button">Submit Request</Button>
            </form>
          </Card>
        </div>

        <div>
          <SectionHeader title="Heroes" subtitle="Page and Carousel Heroes" />
          <div className="mt-8 space-y-8">
            <div className="rounded-2xl overflow-hidden border border-stonehill-line shadow-sm">
              <PageHero 
                title="Page Hero Example" 
                subtitle="With guaranteed text contrast overlay"
                imageUrl="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"
                imageAlt="Sample background"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-stonehill-line shadow-sm">
              <HeroCarousel 
                slides={[
                  {
                    id: "1",
                    title: "Carousel Slide 1",
                    subtitle: "Testing the new flat overlay and dots",
                    imageUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop",
                    imageAlt: "Sample background",
                    primaryCtaLabel: "Learn More",
                    primaryCtaHref: "#",
                    secondaryCtaLabel: "",
                    secondaryCtaHref: "",
                    overlayOpacity: 60,
                    active: true,
                    status: "published",
                    sortOrder: 1,
                    createdBy: "mock",
                    updatedBy: "mock",
                  },
                  {
                    id: "2",
                    title: "Carousel Slide 2",
                    subtitle: "Second slide to test pagination",
                    imageUrl: "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?q=80&w=1978&auto=format&fit=crop",
                    imageAlt: "Sample background 2",
                    primaryCtaLabel: "",
                    primaryCtaHref: "",
                    secondaryCtaLabel: "",
                    secondaryCtaHref: "",
                    overlayOpacity: 60,
                    active: true,
                    status: "published",
                    sortOrder: 2,
                    createdBy: "mock",
                    updatedBy: "mock",
                  }
                ]}
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeader title="Cards & Content" />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SermonCard
              sermon={{
                id: "sermon-1",
                title: "Faith in Action",
                slug: "faith-in-action",
                speaker: "Pastor Smith",
                sermonDate: new Date().toISOString(),
                scripture: "James 2:17",
                series: "Hebrews",
                description: "A message about living faith with love and courage.",
                youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                youtubeVideoId: "dQw4w9WgXcQ",
                thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                thumbnailAlt: "Faith in Action sermon thumbnail",
                featured: true,
                status: "published",
                seoTitle: "Faith in Action",
                seoDescription: "A message about living faith with love and courage.",
                createdBy: "mock-user-1",
                updatedBy: "mock-user-1",
              }}
            />
          </div>
        </div>

        <div>
          <SectionHeader title="States" />
          <div className="mt-8 p-12 bg-white rounded-lg border border-stonehill-line relative h-48">
            <LoadingState text="Loading content..." />
          </div>
        </div>
      </Container>
    </div>
  );
}
