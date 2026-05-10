import { stringifyJsonLd, type JsonLd as JsonLdData } from "@/lib/seo";

type JsonLdProps = {
  data: JsonLdData | JsonLdData[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: stringifyJsonLd(data) }}
    />
  );
}
