import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unified } from '@astrojs/markdown-remark';
import digestCards from '../src/lib/rehype-digest-cards.mjs';

const processor = await unified({ rehypePlugins: [digestCards] }).createRenderer({});

test('each digest entry keeps its source and screenshots in its own card', async () => {
  const markdown = await readFile(new URL('../content/digests/2026-09-10.md', import.meta.url), 'utf8');
  const { code } = await processor.render(markdown.replace(/^---[\s\S]*?---\s*/, ''));
  const cards = code.match(/<article class="digest-card"[\s\S]*?<\/article>/g) ?? [];
  const entries = markdown.split(/(?=^\d+\. )/m).slice(1);
  assert.equal(cards.length, entries.length);
  for (const [index, entry] of entries.entries()) {
    const title = entry.match(/^\d+\. \*\*(.*?)\*\*/)?.[1];
    assert.ok(cards[index].includes(title), `missing title: ${title}`);
    const source = entry.match(/\[原文\]\((.*?)\)/)?.[1];
    assert.ok(cards[index].includes(source), `wrong source for ${title}`);
    const images = [...entry.matchAll(/!\[.*?\]\((.*?)\)/g)].map((match) => match[1]);
    assert.equal((cards[index].match(/<img /g) ?? []).length, images.length);
    for (const image of images) assert.ok(cards[index].includes(image), `wrong image for ${title}`);
  }
});

test('standalone and indented screenshots attach to the preceding entry', async () => {
  const { code } = await processor.render('## AI\n\n1. **One** — Body [原文](https://example.com/one)\n\n![](https://example.com/one.png)\n\n2. **Two** — Body\n\n   ![Second](https://example.com/two.png)\n');
  const cards = code.match(/<article class="digest-card"[\s\S]*?<\/article>/g) ?? [];
  assert.equal(cards.length, 2);
  assert.match(cards[0], /one\.png/);
  assert.doesNotMatch(cards[0], /two\.png/);
  assert.match(cards[1], /two\.png/);
  assert.match(cards[0], /loading="lazy"/);
});
