/**
 * Normalize CMS-authored page content for safe rendering via
 * `dangerouslySetInnerHTML`.
 *
 * The CMS "Page Content" field is a plain textarea today, so editors
 * frequently paste prose with blank lines between paragraphs (and no `<p>`
 * tags), or paste content that opens with `<p>` but never closes. Both forms
 * collapse into a single visual paragraph when injected as raw HTML.
 *
 * `formatPageContent` splits the content on blank-line paragraph breaks,
 * wraps each plain-text chunk in `<p>...</p>`, converts single newlines
 * inside a chunk to `<br />`, and leaves already-block-level HTML
 * (`<p>`, `<h2>`, `<ul>`, etc.) untouched. The transform is idempotent for
 * well-formed HTML and lossless for prose with blank-line breaks.
 */

const BLOCK_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "div",
  "section",
  "article",
  "figure",
  "table",
  "thead",
  "tbody",
  "tr",
  "hr",
];

function startsWithBlockTag(chunk: string): boolean {
  const trimmed = chunk.trimStart().toLowerCase();
  return BLOCK_TAGS.some((tag) => {
    if (!trimmed.startsWith(`<${tag}`)) return false;
    const next = trimmed.charAt(tag.length + 1);
    // Match `<p>`, `<p class="...">`, `<p/>`, but not `<plaintext>` etc.
    return next === ">" || next === " " || next === "/" || next === "\n" || next === "";
  });
}

export function formatPageContent(html: string | null | undefined): string {
  if (!html) return "";

  // Strip leading orphan `<p>` (opening tag with no closing match in the same
  // content) — common when editors paste prose that starts with a `<p>` tag
  // but uses blank lines instead of explicit `</p><p>` boundaries.
  let content = html.trim();
  const openP = (content.match(/<p[\s>]/gi) ?? []).length;
  const closeP = (content.match(/<\/p>/gi) ?? []).length;
  if (openP === 1 && closeP === 0 && content.toLowerCase().startsWith("<p")) {
    content = content.replace(/^<p[^>]*>\s*/i, "");
  }

  // Split on blank-line paragraph breaks. One or more blank lines separates
  // paragraphs; single newlines within a paragraph become `<br />` below.
  const chunks = content
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (chunks.length === 0) return "";

  return chunks
    .map((chunk) => {
      if (startsWithBlockTag(chunk)) return chunk;
      const withBreaks = chunk.replace(/\n/g, "<br />");
      return `<p>${withBreaks}</p>`;
    })
    .join("\n");
}
