import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import digestCards from './src/lib/rehype-digest-cards.mjs';

export default defineConfig({
  site: 'https://x-digest.pages.dev',
  output: 'static',
  markdown: { processor: unified({ rehypePlugins: [digestCards] }) },
});
