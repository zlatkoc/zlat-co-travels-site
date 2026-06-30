# travels.zlat.co

Personal travel site. Each trip is an immersive, scroll-driven article (NYT "Snow Fall" style),
built to work on desktop, tablet, and phone. Static Astro site, deployed to **travels.zlat.co**.

## Stack

- **Astro** (static) — zero JS by default; interactive scenes hydrate as islands.
- **GSAP + ScrollTrigger** — scroll-scrubbing, pinning, parallax.
- **MDX content collections** — one file per trip per language, type-checked frontmatter.
- **astro:assets** — build-time AVIF/WebP + responsive `srcset`.
- **i18n** — English + Slovenian, path-based (`/en/…`, `/sl/…`).
- **Self-hosted fonts** — Fraunces (display), Source Serif 4 (body), IBM Plex Mono (UI); no Google Fonts.
- **Per-trip audio** — silent / one soundtrack / per-video, with a Sound toggle and an `M` shortcut.
- **Gallery lightbox** — captions, keyboard + swipe navigation, neighbour preloading.

## Local development

The toolchain is pinned with a project-local **flox** environment (Node). With direnv:

```bash
cp .envrc.example .envrc   # fill in your values, then:
direnv allow               # runs `use flox`
```

Or activate flox directly: `flox activate`. Then:

```bash
npm install      # first time
npm run dev      # local server
npm run build    # static build → dist/
npm run preview  # serve the build
npm run check    # type-check
```

## Project layout

```
src/
  content/trips/          one MDX per trip per language (iceland.en.mdx, iceland.sl.mdx)
    _media/<trip>/        trip photos (committed, optimized by Astro at build)
  components/scenes/       Hero, ReadingBlock, StickyPhoto, ScrubVideo, PullQuote, Gallery
  components/              ExpeditionHUD, LanguageSwitcher, TripCard, SoundToggle
  layouts/                BaseLayout, TripLayout
  lib/                    motion.ts (GSAP), audio.ts, gallery.ts, trips.ts
  i18n/ui.ts              UI chrome strings (en/sl)
  pages/[lang]/           index + [slug] routes
  styles/                 tokens.css, global.css
scripts/                  archive-backup.sh, publish-media.sh
docs/AUTHORING.md         how to prepare + publish a trip's media
docs/TODO.md              outstanding work + ideas
```

## Adding a trip

See **[docs/AUTHORING.md](docs/AUTHORING.md)** for the full workflow. In short:

1. Create `src/content/trips/<key>.en.mdx` (and `.sl.mdx`) — copy `iceland.en.mdx` as a template.
   Set `draft: true` to keep it out of production while you work.
2. **Photos** → `src/content/trips/_media/<key>/` (committed); import them in the MDX so Astro
   generates AVIF/WebP + `srcset`. Image props also accept a plain URL.
3. **Videos / audio** → preprocess, then `scripts/publish-media.sh` uploads them to the serving
   bucket's `media/` prefix; reference by `https://travels.zlat.co/media/<key>/…`.
4. Compose the article from scene components; set `place`/`coord`/`meta` per scene for the HUD.

### Responsive behavior

`src/lib/motion.ts` gates effects by capability:
- **desktop (fine pointer):** full scroll-scrubbing + pinning + parallax;
- **touch:** cross-fades + autoplay-in-view video, no frame-scrubbing;
- **reduced-motion:** static; HUD still tracks chapters.

Only `transform`/`opacity` are animated. Full-bleed scenes use `svh`/`dvh` so the mobile URL bar
doesn't crop them.

### Media hosting

- **Photos** are committed to the repo (`_media/`) and optimized by Astro at build (no Git LFS).
- **Videos & audio** live on the serving bucket's `media/` prefix (served by the same CloudFront),
  published with `scripts/publish-media.sh`. The site deploy excludes `media/*`, so it never wipes
  them. Image/video props are host-agnostic — local import or URL.
- **Originals + web-ready masters** are backed up to a private archive bucket via
  `scripts/archive-backup.sh`. See [docs/AUTHORING.md](docs/AUTHORING.md).

## Deployment (AWS)

Live at **https://travels.zlat.co**. `.github/workflows/deploy.yml` builds and deploys on every push
to `main` via GitHub OIDC → IAM role (no stored keys): `npm run build` → `aws s3 sync` → CloudFront
invalidation.

Provisioned infra (account `069104960135`, `us-east-1`):
- **S3 `travels-zlat-co-site`** (private, OAC) holds the built site; CloudFront serves it with the
  `*.zlat.co` ACM cert and a Route 53 alias for `travels.zlat.co`. A CloudFront Function rewrites
  directory URLs to `index.html`.
- **`media/` prefix** on the same bucket holds videos/audio (published via
  `scripts/publish-media.sh`); the deploy sync **excludes `media/*`** so it's never wiped.
- **S3 `travels-zlat-co-archive`** (private, versioned) backs up the local media master store.

Repo **Variables** (already set): `AWS_REGION`, `AWS_ROLE_ARN`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`.

Caching: `/_astro/*` hashed assets get `max-age=31536000,immutable`; HTML is `must-revalidate`;
each deploy invalidates CloudFront.
