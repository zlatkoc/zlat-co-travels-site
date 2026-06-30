# TODO

Living list of what's left. The site is live at https://travels.zlat.co; the core experience,
i18n, audio, gallery lightbox, fonts, and the media pipeline are done. This tracks the rest.

## Priority / do next

- [ ] **Add real trips, then delete the Iceland demo.** The Iceland trip is placeholder stock — the
      real goal is your own trips; remove the demo once at least one real trip is published.
- [ ] **Share previews (Open Graph / Twitter cards).** Add `og:image` (trip hero, **absolute URL**),
      `og:url`, `og:site_name`, `twitter:card=summary_large_image`. Makes links show a picture on
      Telegram, iMessage, WhatsApp, Slack, Discord, FB, LinkedIn. Currently no preview image. Quick.
- [ ] **Replace or attribute the demo videos.** Big Buck Bunny + Sintel trailer are **CC BY 3.0
      (attribution required)** and currently live. Swap for real footage, or add a credit line.
- [ ] **End-to-end test `scripts/publish-media.sh`** with one real clip → lands at
      `travels.zlat.co/media/...`, serves, invalidation works. (Only dry-run so far.)
- [ ] **Real-device test on iOS Safari** — unmute-on-tap audio, autoplay-in-view, `dvh` full-bleed,
      sticky pinning. Things desktop/emulators can't confirm.

## Content & structure

- [ ] **Multi-part trips / journeys** (e.g. "Sicily, June 2026" = several segments). Design: a shared
      `journey` key + order on each segment's frontmatter; the index clusters them under a heading,
      optionally a journey landing page. Keeps each segment its own MDX.
- [ ] Verify `audio: { mode: track }` end-to-end with a real looping mp3 (implemented, never demoed).
- [ ] Confirm `archive-backup.sh` against a populated master store (only dry-run so far).

## i18n

- [ ] **Persist selected language** — store the choice (localStorage); honor it when landing on `/`.
      Precedence: explicit saved choice > geo > default (`en`).
- [ ] **Geo default for SI visitors** — CloudFront Function on `/` reading `CloudFront-Viewer-Country`,
      redirect `SI → /sl/`, else `/en/`. Must respect a saved preference and keep crawlers/caching sane.
      Pairs with the persistence item above.

## Maps

- [ ] **Interactive map with markers** of where we've been, from the `lat/lng` already in frontmatter.
      Light client map (MapLibre GL or Leaflet) on a `/map` page or the index.

## Feeds

- [ ] **RSS feed** (per language) via `@astrojs/rss`. Quick.

## Analytics & privacy

- [ ] **Privacy-first, EU analytics** — NOT Google Analytics (GDPR / cookie-consent baggage). Use
      cookieless + EU-hosted so no consent banner is needed: **Plausible** (EU, paid),
      **GoatCounter** (free for personal, NL), or self-hosted **Umami**.

## Social sharing & SEO (beyond og:image)

- [ ] JSON-LD (Article/TravelAction) for richer search results (optional).
- [ ] Favicon set is just `favicon.svg` — add `apple-touch-icon.png` and maybe a web manifest.

## Accessibility

- [ ] **Skip-to-content link** at the top of each page.
- [ ] **Focus trap** in the gallery lightbox (Tab can currently leave the dialog while open).
- [ ] Audit color contrast (HUD/captions over photos, accent on paper).
- [ ] Confirm the whole story reads under `prefers-reduced-motion` (posters, no autoplay).

## Performance

- [ ] Run **Lighthouse (mobile)** on a trip page; watch LCP (hero) and total media weight.
- [ ] Preload the **hero image** and the **display font** to cut LCP/FOUT.

## Deploy & ops

- [ ] **Custom 404** — `404.astro` + CloudFront custom error responses (today unknown paths 403).
- [ ] Bump GitHub Actions runners off the Node-20-deprecation warning (harmless, but tidy).
- [ ] Optional: lifecycle policy on the archive bucket to cap backup cost.
- [ ] Optional: narrow CloudFront invalidations (deploy currently invalidates `/*`).

## Code quality / CI

- [ ] **PR check workflow** — `npm run check` + `npm run build` on pull requests (deploy only runs on `main`).
- [ ] Add **Prettier** (and maybe ESLint).
- [ ] A tiny smoke test (build succeeds, routes exist).

## Legal

- [ ] Decide on a repo **`LICENSE`** (or intentionally leave it all-rights-reserved).
- [ ] Credits/colophon mechanism if a trip uses licensed third-party media (see AUTHORING.md).

## Other ideas

- [ ] "Next trip" link at the end of a trip (`footer.next` i18n string already exists, unused).
- [ ] Reading-progress indicator on trip pages.
- [ ] A small **`M` hint** on the Sound button (the keyboard shortcut is undiscoverable).
- [ ] Test `<Hero>` with a real background **video** (supported, only used with an image so far).
