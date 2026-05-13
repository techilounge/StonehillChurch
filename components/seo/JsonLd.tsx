import { stringifyJsonLd, type JsonLd as JsonLdData } from "@/lib/seo";

type JsonLdProps = {
  data: JsonLdData | JsonLdData[];
  id?: string;
};

function stableHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export function JsonLd({ data, id }: JsonLdProps) {
  const json = stringifyJsonLd(data);

  return (
    <script
      id={id ?? `json-ld-${stableHash(json)}`}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
