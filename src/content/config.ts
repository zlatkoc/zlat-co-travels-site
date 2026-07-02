import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* One MDX file per trip per language, e.g. trips/iceland.en.mdx, trips/iceland.sl.mdx.
   `lang` + `slug` come from frontmatter so each language can have a localized URL
   (e.g. /en/iceland, /sl/islandija). All media is hotlinked (remote URLs), not bundled. */
const trips = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/trips' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      lang: z.enum(['en', 'sl']),
      slug: z.string(), // localized URL slug
      key: z.string(), // shared id across languages (e.g. "iceland") for the switcher

      // Membership in a multi-part journey. Segments live at nested URLs
      // (/en/<journey slug>/<slug>) and are clustered on the index under the
      // journey's card instead of appearing as loose trips.
      journey: z
        .object({
          key: z.string(), // matches a journeys entry `key`
          part: z.number().int().positive(), // 1-based reading order
        })
        .optional(),

      location: z.object({
        name: z.string(),
        lat: z.number(),
        lng: z.number(),
      }),

      // Local imported image (optimized) OR a remote URL (hotlinked).
      heroImage: z.union([image(), z.string().url()]),
      heroAlt: z.string().default(''),
      heroVideo: z.string().url().optional(),
      heroPoster: z.string().url().optional(),

    // Per-trip theme overrides (fall back to tokens.css defaults).
    theme: z
      .object({
        accent: z.string().optional(),
        paper: z.string().optional(),
        ink: z.string().optional(),
      })
      .default({}),

    order: z.number().default(0),
    draft: z.boolean().default(false),

    // Audio mode for the trip (handled by lib/audio.ts):
    //   none      — silent (default); videos autoplay muted
    //   track     — one looping soundtrack for the whole page; videos stay muted
    //   per-video — each video autoplays muted; one tap enables sound on the in-view video
    audio: z
      .preprocess(
        (v) => (v == null || v === 'none' ? { mode: 'none' } : v),
        z.discriminatedUnion('mode', [
          z.object({ mode: z.literal('none') }),
          z.object({ mode: z.literal('track'), src: z.string().url() }),
          z.object({ mode: z.literal('per-video') }),
        ]),
      )
      .default({ mode: 'none' }),
  }),
});

/* One MDX file per journey per language, e.g. journeys/bavaria-2026-06.en.mdx.
   Keys/slugs include YYYY-MM so the same region can host several journeys.
   Frontmatter is the journey metadata; the MDX body is the landing-page intro. */
const journeys = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/journeys' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      dateStart: z.coerce.date(),
      dateEnd: z.coerce.date(),
      lang: z.enum(['en', 'sl']),
      slug: z.string(), // localized URL segment (/en/bavaria-2026-06/)
      key: z.string(), // shared id across languages, referenced by trips `journey.key`

      heroImage: z.union([image(), z.string().url()]),
      heroAlt: z.string().default(''),

      theme: z
        .object({
          accent: z.string().optional(),
          paper: z.string().optional(),
          ink: z.string().optional(),
        })
        .default({}),

      order: z.number().default(0),
      draft: z.boolean().default(false),
    }),
});

export const collections = { trips, journeys };
