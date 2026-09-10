import type { APIRoute } from 'astro';
import { getDigests } from '../lib/digests';
import { SITE } from '../lib/site';
import { formatDateId } from '../lib/dates';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const origin = (site?.toString() ?? 'https://x-digest.pages.dev').replace(/\/$/, '');
  const digests = await getDigests();
  const items = digests
    .map((digest) => {
      const title = escapeXml(`${SITE.name} · ${formatDateId(digest.id)}`);
      const description = escapeXml(digest.data.lead ?? SITE.description);
      const link = `${origin}/${digest.id}/`;
      const pubDate = digest.data.date.toUTCString();
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${origin}/</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
