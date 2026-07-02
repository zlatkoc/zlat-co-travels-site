# Authoring a trip

How to go from "back from a trip with a phone full of media" to a published story.

This doc covers the **mechanics** (files, media prep, publishing). For how to *compose* the
page — the scene catalog, registers, and rules of rhythm — see
[docs/VISUAL-LANGUAGE.md](VISUAL-LANGUAGE.md).

House rule for all media: **publish full-length clips and uncropped photos first**; the owner
reviews the page with complete material and only then decides per-clip trims. Masters always
keep the originals.

## Where media lives (the model)

```
LOCAL MASTER STORE  ($MEDIA_MASTERS_DIR = media-store/ in the repo, gitignored)
  masters/            iPhone originals (HEIC, .mov) — your irreplaceable copies
  web/<trip>/         preprocessed web-ready videos, audio, posters
        │
        ├─ backup ───────────► S3 archive bucket  (travels-zlat-co-archive, private, not served)
        │                       scripts/archive-backup.sh
        │
        ├─ photos (web-ready) ─► WORKING TREE  src/content/trips/_media/<trip>/  ← Astro optimizes these
        │                       gitignored; source of truth is s3://<site-bucket>/media-src/
        │                       scripts/sync-photos.sh push|pull  (CI pulls before every build)
        │
        └─ videos + audio ─────► S3 serving bucket under media/   ← served by CloudFront
                                scripts/publish-media.sh  →  https://travels.zlat.co/media/<trip>/...
```

Rule of thumb:
- **Photos → `_media/` in the working tree, synced with S3, not committed.** They must sit
  inside `src/content/*/_media/` for Astro to import + optimize (AVIF/WebP + `srcset`), but
  they're **gitignored** — the source of truth is the site bucket's `media-src/` prefix.
  `scripts/sync-photos.sh push` after adding photos; `pull` on a fresh clone (CI pulls
  automatically before each build).
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

To review drafts on the real domain (any device, shareable), publish the token preview:
`scripts/publish-preview.sh` → `https://travels.zlat.co/preview-$PREVIEW_TOKEN/en/` — the whole
site with drafts included, noindexed, unlinked. Token lives in `.envrc`; rotate it to kill old
links.

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

## 1b. Journeys (multi-part trips)

A journey groups several trip segments under one landing page (e.g. Bavaria = Munich + Königssee).
The index shows a single journey card; segments live at nested URLs with part navigation.

**Naming: journey keys/slugs include the year and month** — `bavaria-2026-06`, not `bavaria` — so
the same region can host several journeys later. Segment keys are `<journey-key>-<leaf>`
(`bavaria-2026-06-munich`); the segment `slug` is just the leaf (`munich`), because the URL already
carries the journey: `/en/bavaria-2026-06/munich`.

Create the journey entry (one per language, like trips):

```
src/content/journeys/<journey-key>.en.mdx     # frontmatter = metadata, body = landing intro
```

```yaml
title: Bavaria
summary: One-line teaser for the index + meta description.
dateStart: 2026-06-24
dateEnd: 2026-06-28
lang: en
slug: bavaria-2026-06     # localized URL segment (/en/bavaria-2026-06/)
key: bavaria-2026-06      # shared across languages; trips reference this
heroImage: ./_media/bavaria-2026-06/hero.jpg   # journey hero photos live in journeys/_media/
heroAlt: …
theme: { accent: "#3a6b35" }
draft: true
```

Then mark each segment trip as part of it in its frontmatter:

```yaml
journey:
  key: bavaria-2026-06   # must match a journeys entry in the same language
  part: 1                # 1-based reading order
```

Segments with a `journey` key disappear from the index and the flat `/en/<slug>` route — they only
exist under the journey. `part` (not `order`) controls their sequence; the journey's `dateStart`
places the journey card on the index. Media dirs follow the segment keys:
`_media/bavaria-2026-06-munich/`, `media-store/{masters,web}/bavaria-2026-06-munich/`.

A journey published in one language only is fine — the language switcher simply hides itself.
A segment referencing a journey key with no matching entry in its language fails the build loudly.

## 2. Photos

**Prep (per photo — two steps, both matter):**

iPhone shoots **HEIC in Display P3** (wide gamut) with an EXIF orientation tag. The pipeline
must (a) keep the P3 profile — converting to sRGB visibly desaturates on wide-gamut screens;
the site's image service (`src/lib/image-service.ts`) preserves ICC all the way into the
AVIF/WebP derivatives — (b) **bake orientation upright before stripping EXIF** — `sips` only
copies the orientation tag, and stripping it later leaves portrait photos sideways — and
(c) strip EXIF/GPS (originals embed exact location).

```bash
# 1. HEIC → JPEG at web size, NO profile conversion (keeps Display P3):
sips -s format jpeg -s formatOptions 90 -Z 2400 IN.heic --out tmp.jpg

# 2. Bake orientation, keep ICC, strip EXIF, clean re-encode (node + sharp, in-repo):
node -e "require('sharp')('tmp.jpg').rotate().keepIccProfile()
  .jpeg({quality:84,mozjpeg:true}).toFile('out.jpg')"
```

Do NOT run bare `exiftool -all=` on the JPEGs — it can strip the JFIF header and break
Astro's image probe (and it kills the ICC profile). Keep masters; publish derivatives.

**Where:** drop them in `src/content/trips/_media/<trip>/`, run `scripts/sync-photos.sh push`
(they're gitignored — S3 `media-src/` is their home), then import at the top of the MDX:

```mdx
import hero from './_media/iceland/hero.jpg';
import glacier from './_media/iceland/glacier.jpg';

<Hero image={hero} alt="…" title="…" />
<Gallery items={[{ image: glacier, alt: '…', caption: 'Jökulsárlón' }]} />
```

Every image prop also accepts a **plain URL string** (for stock/external) — local imports get
optimized, URLs are hotlinked as-is.

**Aspect ratios:** cinematic scenes (hero / pull-quote / sticky / video) crop to the viewport
via `object-fit: cover` — feed them landscape (16:9 or 3:2) shots that survive cropping and a
dark wash with white text. **Photos that must not be cropped** (portraits, food, objects)
belong in the journal register instead: `PhotoFigure` shows the full frame at natural aspect.
Gallery grid crops to 4:5 (`wide: true` items 16:9). See VISUAL-LANGUAGE.md for choosing.

## 3. Videos

Raw iPhone Pro footage is **not web-ready** and must be preprocessed. iPhone shoots
**10-bit HLG HDR (BT.2020)**; the video encode below passes the HDR color tags through
(browsers render it vivid — that's good), but any **still extracted from it** (posters, hero
stills) must be tonemapped or it comes out washed-out gray.

**Target spec:** H.264 (High), 8-bit `yuv420p`, `.mp4` + **faststart**, ≤1080p, 30 fps,
CRF 23 with a ~7 Mbps cap, **full length** (house rule — trims only after the owner has seen
the page), **keep AAC audio** (the site runs per-video sound; even the hero video is part of
the sound chain), plus a tonemapped poster per clip.

**Produce it (ffmpeg via the flox env):**
```bash
# clip: full length, HDR tags pass through, audio kept
ffmpeg -i IN.mov -vf "scale=-2:1080" -r 30 \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -maxrate 7M -bufsize 14M -preset slow \
  -c:a aac -b:a 128k -movflags +faststart OUT.mp4

# poster (and any still pulled from HDR video): tonemap HLG → SDR, from the MASTER
TM="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
ffmpeg -ss 0.5 -i IN.mov -frames:v 1 -vf "$TM,scale=-2:1080" -q:v 3 OUT.poster.jpg
```
Hero stills / PhotoFigure frames from video: same `$TM` chain at `scale=2400:-2`.
(HandBrake *Web/1080p30* remains a GUI alternative for the clip itself, not the posters.)

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
scripts/sync-photos.sh push  # processed photos in _media/ → serving bucket media-src/
scripts/sync-photos.sh pull  # media-src/ → _media/ (fresh clone; CI runs this pre-build)
```

Photos ship through the build (Astro optimizes them into `dist/_astro/`), but their bytes live
in `media-src/`, not git — push them there and CI pulls before building. Configure paths/buckets
in `.envrc` (see `.envrc.example`).

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
- [ ] Photos in `_media/<trip>/` — orientation baked, P3 kept, EXIF stripped — imported in the
      MDX, `sync-photos.sh push` run
- [ ] Media you don't own is properly licensed; credits noted
- [ ] Every video has a **tonemapped** poster; story still reads under "reduce motion"
- [ ] Videos full-length (trims only after owner review), audio kept, published to `media/`
- [ ] Reviewed on the token preview (`publish-preview.sh`) — including once on a phone
- [ ] Audio (if any) published + wired; `audio` mode set
- [ ] `place` / `coord` / `meta` on each scene for the expedition HUD
- [ ] `theme.accent` sampled from the hero; hero reads with white text
- [ ] Proofread both languages; localized `slug`s
- [ ] `npm run check` clean, `npm run build` clean, scrolled it in the browser
- [ ] `scripts/archive-backup.sh` run; `draft: false`; `git push`
