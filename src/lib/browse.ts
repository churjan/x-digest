import { categoryByLabel, type CategorySlug } from './site';

export type DigestItem = {
  title: string;
  summary: string;
  href: string;
};

export type DigestSection = {
  heading: string;
  slug: string;
  items: DigestItem[];
};

const ITEM_RE =
  /^\d+\.\s+\*\*(.+?)\*\*\s+[—–-]\s+([\s\S]+?)(?:\[原文\]\(([^)]+)\))?\s*$/;

export function browseHref(
  dateId: string | undefined,
  category: CategorySlug | undefined,
  latestId: string | undefined,
): string {
  if (!dateId) return '/';
  const isLatest = dateId === latestId;
  if (!category) return isLatest ? '/' : `/${dateId}`;
  return `/${dateId}/${category}`;
}

export function headingSlug(heading: string): string {
  return categoryByLabel(heading)?.slug ?? heading.trim();
}

export function parseDigestBody(body: string | undefined): DigestSection[] {
  if (!body?.trim()) return [];

  return body
    .split(/^## /m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const newline = chunk.indexOf('\n');
      const heading = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
      const markdown = newline === -1 ? '' : chunk.slice(newline + 1);
      return {
        heading,
        slug: headingSlug(heading),
        items: parseItems(markdown),
      };
    });
}

function parseItems(markdown: string): DigestItem[] {
  return markdown
    .split(/(?=^\d+\.\s+)/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk) => {
      const match = chunk.match(ITEM_RE);
      if (!match) return [];
      return [
        {
          title: match[1].trim(),
          summary: match[2].trim(),
          href: match[3]?.trim() ?? '',
        },
      ];
    });
}

export function sectionsForCategory(
  sections: DigestSection[],
  category: CategorySlug | undefined,
): DigestSection[] {
  if (!category) return sections;
  return sections.filter((section) => section.slug === category);
}
