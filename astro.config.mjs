import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Preview builds (scripts/publish-preview.sh): drafts included, whole site under
// an unguessable /preview-<token>/ base, noindexed, no sitemap.
const preview = process.env.PUBLIC_PREVIEW === '1';
const previewToken = process.env.PREVIEW_TOKEN ?? '';

// Deploy target: https://travels.zlat.co (static, S3 + CloudFront).
export default defineConfig({
  site: 'https://travels.zlat.co',
  base: preview ? `/preview-${previewToken}` : '/',
  output: 'static',

  // English + Slovenian, path-based routing (/en/..., /sl/...).
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'sl'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },

  // "/" → default locale (static redirect page).
  redirects: {
    '/': '/en/',
  },

  integrations: [mdx(), ...(preview ? [] : [sitemap()])],

  image: {
    // Build-time optimization: emit AVIF/WebP + responsive srcset from in-repo (Git LFS) photos.
    responsiveStyles: true,
    // Sharp + keepIccProfile: derivatives keep their Display P3 tag (iPhone photos)
    // instead of being silently flattened to assumed-sRGB.
    service: { entrypoint: './src/lib/image-service.ts' },
  },

  build: {
    // Hashed assets in /_astro get long, immutable cache; HTML stays short (set at CloudFront).
    assets: '_astro',
  },
});
