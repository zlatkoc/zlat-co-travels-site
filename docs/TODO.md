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

- [ ] **Multi-part trips / journeys** (e.g. "Sicily, June 2026" = several segments). Core idea: a shared
      `journey` key + `order` on each segment's frontmatter; the index clusters segments under a heading,
      optionally a journey landing page. Each segment stays its own MDX. Design decisions to settle:
  - **Where journey metadata lives** — a dedicated `journeys` content collection (title, description,
    dates, hero, cover) referenced by key, vs. inferring the journey purely from the shared key on each
    trip. A collection is cleaner once a journey needs its own copy/hero and avoids repeating it on every
    segment.
  - **URL structure** — flat (`/en/sicily-catania`) vs. nested (`/en/sicily/catania`) with the journey as
    a path segment. Nested reads better and gives the landing page a natural `/en/sicily/` home, but
    touches routing and the existing slug scheme.
  - **Intra-journey navigation** — prev/next *within* a journey (segment N of M), plus a link back to the
    journey page. This is what finally uses the unused `footer.next` i18n string (see "Other ideas").
  - **Index presentation** — a journey shows as one clustered card/group rather than N loose trips;
    decide ordering (journey by date, segments by `order`) and how standalone one-off trips still fit.
  - **Cross-cutting** — how journeys interact with i18n (a journey may not exist in every language),
    the map (segments plotted together / a journey route line), RSS, and taxonomy (`journey` as a facet).
- [ ] Verify `audio: { mode: track }` end-to-end with a real looping mp3 (implemented, never demoed).
- [ ] Confirm `archive-backup.sh` against a populated master store (only dry-run so far).
- [ ] **Site name / description / contact copy.** Current text is placeholder — write proper wording for
      the site title, meta description, and a contact line/link. Feeds the OG/SEO items above too.
- [ ] **Preview work-in-progress pages.** A way to see draft trips on the (deployed) site without
      publishing them to everyone. Options: a `draft: true` frontmatter flag that hides a trip from the
      index and sitemap but keeps its page reachable at an unguessable/gated URL; a separate preview
      deploy/subdomain; or gate drafts behind the friends login (see below). Decide the mechanism.
- [ ] **Trip taxonomy + filtering.** Add structured facets to frontmatter — `tags`, `country`, `year`
      (or derive year from the trip date) — and surface them: a filterable index and/or an
      archive-by-year view, with tag/country landing pages. One flat list stops scaling once real trips
      land; this is what makes the collection browsable. Feeds RSS-per-tag and the map later.

## i18n

- [ ] **Persist selected language** — store the choice (localStorage); honor it when landing on `/`.
      Precedence: explicit saved choice > geo > default (`en`). Note: if the edge resolver / `/l/` share
      URL below ever happens, the choice must also be written as a **cookie** — a CloudFront Function
      can't read localStorage.
- [ ] **Geo default for SI visitors** — CloudFront Function on `/` reading `CloudFront-Viewer-Country`,
      redirect `SI → /sl/`, else `/en/`. Must respect a saved preference and keep crawlers/caching sane.
      Pairs with the persistence item above.
- [ ] **Language-neutral share URL (`/l/<slug>`).** _Priority: lowest — nice-to-have, meaningfully more
      moving parts._ An adaptive entry URL so sharing can show the recipient *their* language instead of
      the sender's: share `/en/<slug>` to force English, `/l/<slug>` (handed out by a Share/Copy-link
      button) to resolve per visitor. A **CloudFront Function** on `/l/*` 302s to `/en|sl/<slug>` using the
      precedence above (saved cookie > `CloudFront-Viewer-Country` > `Accept-Language` > `en`). Design
      points if picked up: prefs must be a **cookie** (edge can't see localStorage); `/l/` keys off a
      **stable trip id**, not a localized slug, if slugs differ per language; mark `/l/*` `noindex` and
      keep only `/en/` + `/sl/` (with hreflang) in the sitemap; preview bots resolve to the default and
      show a generic card (fine); `/l/*` responses vary by country+cookie → no-cache. Unifies this with
      the two i18n items above rather than being separate.

## Maps

- [ ] **Interactive map with markers** of where we've been, from the `lat/lng` already in frontmatter.
      Light client map (MapLibre GL or Leaflet) on a `/map` page or the index.

## Feeds

- [ ] **RSS feed** (per language) via `@astrojs/rss`. Quick.

## Private / gated content

- [ ] **Friends sign-up / log-in with private media.** _Priority: low._ Logged-in friends see personal
      photos/videos; logged-out visitors don't, and **must not** be able to reach private media by
      guessing filenames. So gating the page markup is not enough — the media objects themselves need
      protection. Sketch: an auth provider (**Auth0**?) issues a JWT; a **CloudFront Function / Lambda@Edge**
      on the private-media path validates the token (or signed cookies / signed URLs) before serving.
      Public trips stay open; private assets 403 without a valid token. Decide public-vs-private media
      layout (separate prefix/bucket) and how drafts (above) tie in.
- [ ] **Guestbook / reactions for friends.** _Depends on the friends login._ Let logged-in friends leave
      a short note or a lightweight reaction (❤️/👍) on a trip. Keep it privacy-conscious and EU-hosted
      (a small serverless endpoint + DB, or an existing cookieless comments service); moderated or
      friends-only so it can't be spammed. Static-site-friendly: the page stays static, comments load
      client-side after auth.

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
- [ ] **Per-photo captions & alt-text audit.** Once real content lands, pass over every image/video and
      ensure meaningful `alt` text (not filenames, not empty unless truly decorative) and captions where
      they add context. Helps screen-reader users **and** SEO/OG. Consider making `alt` required in the
      content schema so it can't be forgotten at authoring time.

## Performance

- [ ] Run **Lighthouse (mobile)** on a trip page; watch LCP (hero) and total media weight.
- [ ] Preload the **hero image** and the **display font** to cut LCP/FOUT.
- [ ] **Video delivery strategy.** Images already ship responsive (`<Picture>`, AVIF/WebP, srcset) — video
      doesn't. Trips serve single `.mp4`s with no adaptive bitrate. Add poster frames + `preload="metadata"`
      so clips don't pull bytes until played, and for longer footage evaluate **HLS** (multiple renditions,
      `hls.js`) so mobile gets a lighter stream. Goal: cut mobile data weight without hurting the
      autoplay-in-view scenes.
- [ ] **CLS audit for video & embeds.** `<Picture>` gives images intrinsic dimensions, so they don't shift
      layout — confirm `<video>`, any iframes, and the map reserve their space too (explicit
      width/height or aspect-ratio). Check with Lighthouse's CLS metric on a media-heavy trip.

## Deploy & ops

- [ ] **Custom 404** — `404.astro` + CloudFront custom error responses (today unknown paths 403).
- [ ] Bump GitHub Actions runners off the Node-20-deprecation warning (harmless, but tidy).
- [ ] Optional: lifecycle policy on the archive bucket to cap backup cost.
- [ ] Optional: narrow CloudFront invalidations (deploy currently invalidates `/*`).
- [ ] **Security response headers.** No CSP / HSTS / `X-Content-Type-Options` / `Referrer-Policy` /
      `X-Frame-Options` today. Attach a **CloudFront Response Headers Policy** (or add headers via a
      CloudFront Function). Start CSP in report-only to avoid breaking inline styles/scripts, tighten,
      then enforce. Cheap, meaningful hardening for a static site.
- [ ] **Uptime + error monitoring.** A lightweight uptime ping (UptimeRobot / Better Stack free tier, or
      a CloudWatch synthetic canary) that alerts if the site 5xx's or goes dark. Optionally add
      privacy-friendly client error tracking (self-hosted **Sentry** or **GlitchTip**) — but only if it
      stays cookieless and EU-friendly, consistent with the analytics stance.

## Cross-browser & device testing

- [ ] **Browser / platform test matrix.** The iOS-Safari item above is the highest-risk cell; formalize
      the rest. Target grid:

      |            | Chrome | Firefox | Safari |
      | ---------- | :----: | :-----: | :----: |
      | Desktop    |   ✓    |    ✓    |   ✓    |
      | iOS        |   —¹   |    —¹   |   ✓    |
      | Android    |   ✓    |    ✓    |    —   |

      ¹ iOS Chrome/Firefox are WebKit skins → covered by iOS Safari.

      Approach: **Playwright** for the automated layer — its three engines (Chromium / Firefox / WebKit)
      cover most of the desktop grid headlessly and can run in the PR-check workflow. WebKit ≠ real iOS
      Safari, though, so keep **manual real-device passes** for the mobile row (autoplay/unmute audio,
      `dvh` full-bleed, sticky pinning — the things emulators lie about). For breadth on hardware you
      don't own, a cloud device farm (**BrowserStack / LambdaTest / Sauce Labs**, free tiers for OSS)
      or Playwright-on-BrowserStack. Note the min versions you support and what each layer actually covers.

## Code quality / CI

- [ ] **PR check workflow** — `npm run check` + `npm run build` on pull requests (deploy only runs on `main`).
- [ ] Add **Prettier** (and maybe ESLint).
- [ ] A tiny smoke test (build succeeds, routes exist).
- [ ] **Automated dependency updates.** Add **Dependabot** (`.github/dependabot.yml`) or **Renovate** for
      npm packages and GitHub Actions. Keeps Astro/integrations current and quietly fixes the
      Node-20-runner deprecation as part of the same flow. Group minor/patch PRs to cut noise.
- [ ] **Broken-link / build-artifact check in CI.** After `npm run build`, crawl `dist/` for dead
      internal links and missing media/asset references (e.g. `linkinator`, `lychee`, or a small script),
      and fail the PR check on breakage. Cheap guard against a renamed slug or a media file that never
      published. Slots into the PR-check workflow above.

## Legal

- [ ] Decide on a repo **`LICENSE`** (or intentionally leave it all-rights-reserved).
- [ ] Credits/colophon mechanism if a trip uses licensed third-party media (see AUTHORING.md).

## Other ideas

- [ ] "Next trip" link at the end of a trip (`footer.next` i18n string already exists, unused).
- [ ] Reading-progress indicator on trip pages.
- [ ] A small **`M` hint** on the Sound button (the keyboard shortcut is undiscoverable).
- [ ] Test `<Hero>` with a real background **video** (supported, only used with an image so far).
