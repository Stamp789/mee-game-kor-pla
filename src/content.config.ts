import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const mods = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/mods' }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string(), thaiTitle: z.string(), code: z.string(),
    version: z.string(), gameBuild: z.string(),
    platform: z.union([z.string(), z.array(z.string())]),
    source: z.enum(['nexus', 'drive', 'mediafire']),
    store: z.url(),
    purchaseLinks: z.array(z.object({ label: z.string(), href: z.url() })),
    statusText: z.string(), date: z.string(), popularity: z.number(), size: z.string(),
    translator: z.string(), category: z.string(), tags: z.array(z.string()),
    colors: z.array(z.string()), cover: z.string(),
    gallery: z.array(z.url()).default([]), trailerTitle: z.string().optional(),
    description: z.string(), changelog: z.array(z.string()), install: z.array(z.string()),
    sha: z.string(), nexus: z.string().optional(), drive: z.string().optional(),
    mediafire: z.string().optional(), post: z.string().optional(),
  }),
});
export const collections = { mods };
