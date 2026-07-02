# Visual language

The shared vocabulary for talking about trip pages: what building blocks exist, how each
renders, and the rules of rhythm between them. When we discuss a page, we speak in these
terms ("turn the trout into a PhotoFigure", "this video run needs a reading beat").

## Two registers

Every scene belongs to one of two visual registers; the interplay between them is the
page's rhythm.

- **Cinematic** — full-bleed, viewport-filling, media *behind* text, white type, dark
  washes. Immersive, loud. (Hero, ScrubVideo, StickyPhoto, PullQuote)
- **Journal** — the paper background, ink text in a centered reading column, images as
  objects *within* the flow. Quiet, print-like. (ReadingBlock, PhotoFigure, Gallery)

A page that never leaves cinematic feels like unnarrated B-roll; one that never leaves
journal feels like a blog. Alternate.

## Foundations

- **Typefaces** — three voices:
  - *Fraunces* (display serif, SOFT axis = rounded terminals): titles, headings, the
    drop cap, pull quotes, the end mark. The "voice of the story".
  - *Source Serif* (body serif): all narrative prose. The "voice of the narrator".
  - *IBM Plex Mono* (uppercase, letterspaced): eyebrows, captions-as-labels, HUD, nav,
    buttons. The "voice of the instrument panel" — anything that is *about* the story
    rather than *of* it.
- **Colors** — per-trip theme over global tokens: `--paper` (warm off-white page),
  `--ink` (near-black), `--accent` (one color per trip, sampled from the hero; used for
  eyebrows, drop cap, end mark, focus rings), `--hud-bg` (dark translucent pill behind
  any white text that floats over media — HUD, back button, video captions).
- **Reading column** (`.measure`) — 38rem minus gutters (~65ch). ALL narrative prose
  sits in this column, including PhotoFigure captions. If text is wider, it's wrong.
- **Section gap** — the standard vertical air between scenes. Journal scenes carry it
  as padding; cinematic scenes are flush (they meet each other edge-to-edge).

## Page anatomy (a trip/segment page)

```
[skip-back pill]                      [language switcher]
┌────────────────────────────────────────────────────────┐
│ Hero                                                   │
│   … scenes, in order …                                 │
│ ⁂  end mark (automatic)                                │
├────────────────────────────────────────────────────────┤
│ dark footer: JourneyNav (part N of M, prev/next, back) │
│              all-trips link · copyright                │
└────────────────────────────────────────────────────────┘
[expedition HUD, bottom-left]            [sound toggle, bottom-right]
```

- **Expedition HUD** — the little instrument panel bottom-left. Every scene carries
  `place` / `coord` / `meta`; whichever scene is mid-viewport drives the HUD. `meta` is
  the chapter label ("June 28 — 08:15, first boat"), so scene order = chapter order.
- **Sound model** (`per-video` mode) — all videos autoplay muted in view. One tap on
  Sound (or `M`) unmutes the *active* video; its audio keeps playing as a soundtrack
  over prose until the next video scrolls in and takes over. A video hero is part of
  this chain (it's the first video). Reduced-motion visitors get posters, no autoplay.
- **End mark** — the accent asterism `⁂` closes every page automatically (the bookend
  to the opening drop cap). Not authored per page.

## Scene catalog

### Hero — the opening shot (cinematic)
```
┌────────────────────────────────────┐
│    (photo or muted video loop)     │
│         EYEBROW · MONO             │
│         Title (Fraunces)           │
│         subtitle, italic           │
│               ↓                    │
└────────────────────────────────────┘
```
Full viewport. Radial scrim + text shadows keep the copy readable over bright media.
Ken Burns drift on the media; title parallaxes out on scroll. With `video`, it joins
the sound chain. One per page, always first. Eyebrow carries the journey context
("Bavaria — Part 2 of 2").

### ReadingBlock — narrative prose (journal)
```
        ┌──────────────────┐
        │ Sunday started…  │   ← reading column on paper
        │ indent…          │
        └──────────────────┘
```
The narrator speaking. `dropcap` on the page's first block only (accent-colored big
letter). Editorial indents between paragraphs. This is also the "reading beat" that
must introduce videos — a video without a preceding beat reads as unnarrated footage.

### ScrubVideo — a moving scene (cinematic)
```
┌────────────────────────────────────┐
│         (video, autoplay           │
│          muted in view)            │
│        [caption in dark pill]      │
└────────────────────────────────────┘
```
Full viewport video with a mono caption pill at the bottom (clear of the HUD). Caption
is a *label*, one line, not narrative. Optional `scrub` ties playback to scroll on
desktop (use sparingly — it hijacks scrolling). Audio unmutes via the sound model.

### StickyPhoto — one place, several moments (cinematic)
```
┌────────────────────────────────────┐
│ (pinned photo, cross-fades)  ┌───┐ │
│                              │txt│ │  ← caption cards
│                              └───┘ │     scroll past
└────────────────────────────────────┘
```
The frame pins; as each caption card scrolls by, the photo cross-fades to the next
step. Use for a sequence of connected moments (the walk to the Obersee). 2–4 steps;
with a single step it degrades to "one pinned photo + one card" (we now prefer
PhotoFigure for that). Step text is short narrative, card-boxed.

### PullQuote — the emotional beat (cinematic)
```
┌────────────────────────────────────┐
│      (photo, dark wash 45%)        │
│     "One italic display quote      │
│        over the image."            │
│           — CITE · MONO            │
└────────────────────────────────────┘
```
Full-bleed photo behind a centered Fraunces-italic quote. The page's exclamation
point — one strong sentence-to-paragraph, max one or two per page. Slow parallax on
the background. Pick images that survive a dark wash.

### PhotoFigure — a photo as an object (journal)
```
        ┌────────────┐
        │   (photo,  │    ← natural aspect, centered,
        │  no crop)  │       air left/right, on paper
        └────────────┘
        Caption set as normal
        narrative prose, in the
        reading column.
```
The quiet single-photo scene. Never cropped, never full-bleed; capped at a comfortable
width/height. Caption *is* story prose (same column, same voice as ReadingBlock) — the
narrative flows through the photo. Click opens the lightbox. Use when one photo
deserves to stand alone (the trout, the closing shot).

### Gallery — the contact sheet (journal)
```
        ┌────┐ ┌────┐
        │4:5 │ │4:5 │   ← masonry on paper-2,
        └────┘ └────┘      mono label captions
        ┌───wide 16:9──┐
        └──────────────┘
```
A grid of leftovers/texture shots: 4:5 crops, `wide` items span two columns, mono
label captions, lightbox on click. A grab-bag by nature — good for thematic clusters
(Munich's food), bad as a finale on a chronological page (it rewinds time). If an item
carries a story beat, promote it to PhotoFigure at its chronological spot.

## Rules of rhythm

1. **Chronology is the default** — scenes in capture order; the HUD `meta` labels read
   as chapters. Deviate only deliberately (thematic pages) and say so.
2. **Text before video** — every video (or tight pair) gets a reading beat introducing
   it. Never more than two cinematic video scenes without returning to the journal
   register.
3. **Captions know their register** — pill captions on video are mono labels; figure
   captions are narrative prose sentences. Don't swap voices.
4. **One hero, at most a couple of pull quotes, one end mark.** Scarcity is what makes
   them land.
5. **Media integrity** — full-length clips, uncropped photos (baked upright), until the
   owner decides cuts. Cinematic scenes crop by nature (object-fit cover); if cropping
   hurts the image, it belongs in a journal scene instead.
6. **Everything anchors the HUD** — every scene carries `place`/`coord`/`meta`; a scene
   without them is invisible to the expedition log.

## Reference implementation

The Königssee page (`src/content/trips/bavaria-2026-06-koenigssee.en.mdx`) is the
canonical example of the full grammar: video hero → dropcap beat → signature video →
beats and walks (sticky) → pull quote → figures at their chronological spots → closing
figure → ⁂.
