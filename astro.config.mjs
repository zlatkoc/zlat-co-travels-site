import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Deploy target: https://travels.zlat.co (static, S3 + CloudFront).
export default defineConfig({
  site: 'https://travels.zlat.co',
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

  integrations: [mdx(), sitemap()],

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
