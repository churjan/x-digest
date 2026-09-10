import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const digests = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/digests' }),
  schema: z.object({
    date: z.coerce.date(),
    lead: z.string().optional(),
  }),
});

export const collections = { digests };
