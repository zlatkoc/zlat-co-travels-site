# Authoring a trip

How to go from "back from a trip with a phone full of media" to a published story.

## Where media lives (the model)

```
LOCAL MASTER STORE  ($MEDIA_MASTERS_DIR = media-store/ in the repo, gitignored)
  masters/            iPhone originals (HEIC, .mov) — your irreplaceable copies
  web/<trip>/         preprocessed web-ready videos, audio, posters
        │
        ├─ backup ───────────► S3 archive bucket  (travels-zlat-co-archive, private, not served)
        │                       scripts/archive-backup.sh
        │
        ├─ photos (web-ready) ─► REPO  src/content/trips/_media/<trip>/   ← Astro optimizes these
        │                       committed as normal git files (no LFS)
        │
        └─ videos + audio ─────► S3 serving bucket under media/   ← served by CloudFront
                                scripts/publish-media.sh  →  https://travels.zlat.co/media/<trip>/...
```

Rule of thumb:
- **Photos → the repo** (`src/content/trips/_media/<trip>/`). Only here can Astro generate AVIF/WebP + `srcset`. They're small, so plain git is fine.
- **Videos & audio → the `media/` prefix on the serving bucket** (never git — they're big). Published with `scripts/publish-media.sh`, referenced by URL.
- **Everything (originals + web) → the archive bucket** as backup, via `scripts/archive-backup.sh`.

## 1. Start a trip (and park it as a draft)

Create two files (one per language):

```
src/content/trips/<key>.en.mdx
src/content/trips/<key>.sl.mdx
```

Set `draft: true` in frontmatter. **Draft trips appear in `npm run dev` but are excluded from the
production build**, so a trip can sit half-finished for as long as you like without going live. Flip
`draft: false` (or remove it) when it's ready. Working on a branch is optional but tidy.

`key` is shared across languages (links the language switcher); `slug` is the localized URL.

### Frontmatter reference

```yaml
title: Seven Days Around Iceland
summary: One-line teaser for the index + meta description.
date: 2026-06-01
lang: en            # en | sl
slug: iceland       # localized URL segment (/en/iceland)
key: iceland        # shared across languages
location: { name: Iceland, lat: 64.96, lng: -19.02 }
heroImage: ./_media/iceland/hero.jpg   # local import (optimized) OR an https URL
heroAlt: A waterfall under a pale sky
theme: { accent: "#2f6f7e" }           # accent colour, sample it from the hero
order: 1            # tie-breaker for the index (newest date first)
draft: false
audio:              # optional — omit for silent
  mode: per-video   # none | track | per-video
  # src: https://travels.zlat.co/media/iceland/ambient.mp3   # only for mode: track
```

### The media map (`M`)

Keep every media reference for a trip in one `const M = { … }` map at the top of the MDX body, then
use `M.hero`, `M.coast`, … in the scenes — one place to see and swap every URL/import:

```mdx
import hero from './_media/iceland/hero.jpg';   // local photo → Astro optimizes

export const M = {
  hero,
  coast: 'https://travels.zlat.co/media/iceland/coast.mp4',     // video on the media CDN
  ambient: 'https://travels.zlat.co/media/iceland/ambient.mp3', // audio on the media CDN
};

<Hero image={M.hero} … />
<ScrubVideo video={M.coast} poster="…" />
```

## 2. Photos

**Prep (you do this once per photo):**
- iPhone shoots **HEIC** — convert to **JPEG or WebP** (Chrome/Firefox can't show HEIC).
- Resize to ~**2400 px** long edge (gallery photos ~1600 px is plenty), quality ~80, **sRGB**.
- **Strip EXIF/GPS** (your originals embed exact location — don't publish that).
- macOS one-liners (no installs): `sips -s format jpeg in.heic --out out.jpg` then
  `sips -Z 2400 out.jpg`. Or a `sharp` script. Keep masters; publish derivatives.

**Where:** drop them in `src/content/trips/_media/<trip>/`, then import at the top of the MDX:

```mdx
import hero from './_media/iceland/hero.jpg';
import glacier from './_media/iceland/glacier.jpg';

<Hero image={hero} alt="…" title="…" />
<Gallery items={[{ image: glacier, alt: '…', caption: 'Jökulsárlón' }]} />
```

Every image prop also accepts a **plain URL string** (for stock/external) — local imports get
optimized, URLs are hotlinked as-is.

**Aspect ratios:** hero / pull-quote / video scenes → landscape (16:9 or 3:2). Gallery grid → 4:5
portrait reads best; the `wide: true` gallery item is 16:9. Hero/quote get a dark wash with white
text on top — pick shots that work with that.

## 3. Videos

Raw iPhone Pro footage is **not web-ready** and must be preprocessed.

**Easiest: capture web-friendly.** On the phone, *Settings → Camera → Formats → "Most Compatible"*
records **H.264 + SDR** instead of HEVC+HDR, which removes the two hardest problems.

**Target spec:** H.264 (High), 8-bit `yuv420p`, `.mp4` + **faststart**, ≤1080p, SDR/Rec.709,
30 fps, ~4–8 Mbps, short loop (10–30 s), plus a poster frame. Keep audio (AAC) only if you want
per-video sound; drop it (`-an`) for silent background loops.

**Produce it (you run this):**
- **HandBrake** (GUI, simplest): preset *Web / 1080p30*; it ingests HEVC and tone-maps HDR for you.
- **ffmpeg:**
  ```bash
  ffmpeg -i IN.mov -vf "scale=-2:1080" -c:v libx264 -profile:v high \
    -pix_fmt yuv420p -crf 21 -preset slow -an -movflags +faststart OUT.mp4
  ffmpeg -ss 0.5 -i OUT.mp4 -frames:v 1 -q:v 3 OUT.poster.jpg
  ```
  For footage actually shot in HDR, HandBrake is the easy path (the ffmpeg HDR→SDR `zscale/tonemap`
  chain is fiddly).

**Where:** put the web-ready `.mp4` + poster in your local `web/<trip>/`, then publish:

```bash
scripts/publish-media.sh            # syncs web/ → s3://…/media/ and invalidates /media/*
```

Reference by URL in the MDX:

```mdx
<ScrubVideo
  video="https://travels.zlat.co/media/iceland/coast.mp4"
  poster="https://travels.zlat.co/media/iceland/coast.poster.jpg"
  caption="The south coast"
/>
```

By default video **autoplays muted in view**; add `scrub` for the scroll-scrubbed effect.

## 4. Audio (background track)

- **MP3** ~128–192 kbps, a seamless **30 s–2 min loop**, normalized gently (~−16 LUFS) — it's a
  bed, not a blast. Royalty-free or your own.
- Publish it the same way as video (`web/<trip>/ambient.mp3` → `publish-media.sh` → `media/`).
- Wire it: `audio: { mode: track, src: "https://travels.zlat.co/media/<trip>/ambient.mp3" }`.
- Reminder: audio can't autoplay — the viewer taps the **Sound** button (or presses **M**).

Audio modes: `none` (silent), `track` (one looping soundtrack), `per-video` (each video's own audio,
the in-view clip is unmuted, continues across photos until the next video).

## 5. Backup & publish (the two scripts)

```bash
scripts/archive-backup.sh    # local master store → archive bucket (off-disk backup)
scripts/publish-media.sh     # web-ready videos/audio → serving bucket media/ + CF invalidation
```

Photos don't need a script — they're committed to the repo and ship through the normal
`git push` → CI build → deploy. Configure paths/buckets in `.envrc` (see `.envrc.example`).

## Licensing & credits

Publish only media you have the right to:
- **Your own photos/video/audio** — fine; just strip EXIF/GPS from photos first (above).
- **Stock or someone else's** — use properly-licensed sources and honor attribution where the
  license requires it (e.g. some Creative Commons terms). Keep a note of sources/credits for
  anything not yours.
- **Music** — royalty-free or licensed; a background track still needs clearance.

> The demo Iceland trip uses free stock (Unsplash/Pexels) + sample video clips purely as
> placeholders — replace them before treating that trip as "real".

## Performance & accessibility

- **Page weight** — a handful of strong photos beats dozens; keep them web-sized (~2400 px) so a
  trip page stays light. Astro lazy-loads below-the-fold images and only ships scene JS when needed.
- **Reduced motion** — visitors with "reduce motion" set get **no autoplay or scrubbing**; they see
  the **poster** frames and static images. So every video needs a good poster, and the story must
  still read with nothing moving.

## Pre-publish checklist

- [ ] Both `*.en.mdx` and `*.sl.mdx` written, frontmatter complete
- [ ] Photos in `_media/<trip>/`, EXIF stripped, imported in the MDX
- [ ] Media you don't own is properly licensed; credits noted
- [ ] Every video has a poster; story still reads under "reduce motion"
- [ ] Videos preprocessed + posters, published to `media/`, URLs referenced
- [ ] Audio (if any) published + wired; `audio` mode set
- [ ] `place` / `coord` / `meta` on each scene for the expedition HUD
- [ ] `theme.accent` sampled from the hero; hero reads with white text
- [ ] Proofread both languages; localized `slug`s
- [ ] `npm run check` clean, `npm run build` clean, scrolled it in the browser
- [ ] `scripts/archive-backup.sh` run; `draft: false`; `git push`
