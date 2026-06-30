# TODO

Living list of what's left. The site is live at https://travels.zlat.co; the core experience,
i18n, audio, gallery lightbox, fonts, and the media pipeline are done. This tracks the rest.

## Priority / do next

- [ ] **Replace or attribute the demo videos.** Big Buck Bunny + the Sintel trailer are **CC BY 3.0
      (attribution required)** and are currently live. Swap for real footage, or add a credit line.
- [ ] **End-to-end test `scripts/publish-media.sh`** with one real clip → confirm it lands at
      `travels.zlat.co/media/...`, serves, and the CloudFront invalidation works. (Only dry-run so far.)
- [ ] **Real first trip** to replace the placeholder Iceland demo (stock photos + sample clips).
- [ ] **Real-device test on iOS Safari** — audio unmute-on-tap, autoplay-in-view, `dvh` full-bleed,
      sticky pinning. These are the things desktop/emulators can't confirm.

## Content / media

- [ ] Verify `audio: { mode: track }` end-to-end with a real looping mp3 (implemented, never demoed).
- [ ] Confirm `archive-backup.sh` against a populated master store (only dry-run so far).
- [ ] Decide whether the Iceland demo stays as a labelled demo or gets deleted once a real trip exists.

## SEO & social sharing

- [ ] **`og:image` per page** (use the trip's hero) + Twitter card tags — currently no preview image
      when a link is shared. High value, easy.
- [ ] Per-page canonical/OG are set; add JSON-LD (Article) if we want richer search results (optional).
- [ ] Favicon set is just `favicon.svg` — add `apple-touch-icon.png` and maybe a web manifest.

## Accessibility

- [ ] **Skip-to-content link** at the top of each page.
- [ ] **Focus trap** in the gallery lightbox (Tab can currently leave the dialog while it's open).
- [ ] Audit color contrast (HUD/captions over photos, accent on paper).
- [ ] Confirm the whole story reads under `prefers-reduced-motion` (posters, no autoplay).

## Performance

- [ ] Run **Lighthouse (mobile)** on a trip page; watch LCP (hero) and total media weight.
- [ ] Consider preloading the **hero image** and the **display font** to cut LCP/FOUT.
- [ ] Sanity-check the per-page JS (GSAP loads on trip pages only — keep it that way).

## Deploy & ops

- [ ] **Custom 404** — add `404.astro` + CloudFront custom error responses (today unknown paths 403).
- [ ] Bump GitHub Actions runners off the Node-20-deprecation warning (harmless, but tidy).
- [ ] Optional: lifecycle policy on the archive bucket to cap backup storage cost.
- [ ] Optional: narrow CloudFront invalidations (deploy currently invalidates `/*`).

## Code quality / CI

- [ ] **PR check workflow** — run `npm run check` + `npm run build` on pull requests (separate from
      deploy, which only runs on `main`).
- [ ] Add **Prettier** (and maybe ESLint) for consistent formatting.
- [ ] No tests yet — a tiny smoke test (build succeeds, routes exist) could be enough.

## Legal

- [ ] Decide on a repo **`LICENSE`** (or intentionally leave it all-rights-reserved).
- [ ] Credits/colophon mechanism if any trip uses licensed third-party media (see AUTHORING.md).

## Nice-to-have / ideas

- [ ] "Next trip" link at the end of a trip (the `footer.next` i18n string already exists, unused).
- [ ] Reading-progress indicator on trip pages.
- [ ] A small **`M` audio hint** on the Sound button (the keyboard shortcut is undiscoverable).
- [ ] Map view using the trip coordinates (a personal atlas).
- [ ] RSS feed of trips.
- [ ] Browser-language redirect at `/` (CloudFront Function) instead of always `/en/` — SEO-neutral,
      optional; explicit locale paths are fine.
- [ ] Test `<Hero>` with a real background **video** (supported, only used with an image so far).
