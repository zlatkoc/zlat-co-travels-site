/* ---------------------------------------------------------------------------
   Central motion layer. Components render plain markup with data-attributes;
   this file wires all behavior in one place, gated by device capability:

     - reduced-motion        -> no animation; HUD still tracks chapters
     - coarse pointer (touch) -> fades + autoplay loops; no frame-scrubbing/pin
     - fine pointer (desktop) -> full scrub + parallax

   Only `transform` / `opacity` are animated (GPU-friendly, no layout thrash).
--------------------------------------------------------------------------- */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqFine = matchMedia('(pointer: fine)');

export function initMotion(): void {
  // The HUD tracks scroll position regardless of motion preference.
  initHud();

  if (mqReduced.matches) return; // static reading experience

  const fine = mqFine.matches;
  document.documentElement.classList.add('js-motion');
  gsap.registerPlugin(ScrollTrigger);

  initReveals();
  initHeroes(fine);
  initStickyPhotos();
  initScrubVideos(fine);
  initPullQuotes(fine);

  // Recompute after fonts/images settle.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* Generic fade-up for anything tagged [data-reveal]. */
function initReveals(): void {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

/* Hero: Ken Burns drift on the media + title parallax-out on scroll. */
function initHeroes(fine: boolean): void {
  gsap.utils.toArray<HTMLElement>('.scene-hero').forEach((hero) => {
    const media = hero.querySelector<HTMLElement>('[data-hero-media]');
    const title = hero.querySelector<HTMLElement>('[data-hero-title]');

    if (media) {
      gsap.fromTo(
        media,
        { scale: 1.08 },
        {
          scale: 1.18,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
        },
      );
    }
    if (title && fine) {
      gsap.to(title, {
        yPercent: -40,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  });
}

/* Sticky photo: frame is pinned via CSS `position: sticky`; as each caption step
   enters, cross-fade the matching image layer. Works on every device. */
function initStickyPhotos(): void {
  gsap.utils.toArray<HTMLElement>('.scene-sticky').forEach((scene) => {
    const layers = gsap.utils.toArray<HTMLElement>('[data-sticky-layer]', scene);
    const steps = gsap.utils.toArray<HTMLElement>('[data-sticky-step]', scene);
    if (!layers.length || !steps.length) return;

    const show = (i: number) =>
      layers.forEach((layer, idx) => gsap.to(layer, { opacity: idx === i ? 1 : 0, duration: 0.6 }));

    show(0);
    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => show(i),
        onEnterBack: () => show(i),
      });
    });
  });
}

/* Scrub video: desktop ties currentTime to scroll; touch autoplay-loops in view. */
function initScrubVideos(fine: boolean): void {
  gsap.utils.toArray<HTMLElement>('.scene-scrub').forEach((scene) => {
    const video = scene.querySelector<HTMLVideoElement>('[data-scrub-video]');
    const pan = scene.querySelector<HTMLElement>('[data-scrub-pan]');

    // Wide-image "camera pan" (used when there's no video yet).
    if (pan) {
      gsap.fromTo(
        pan,
        { xPercent: 0 },
        {
          xPercent: -((pan.scrollWidth / pan.clientWidth - 1) * 100) || -20,
          ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }

    if (!video) return;

    if (fine) {
      // Frame-scrub: map scroll progress -> video time once metadata is known.
      const wire = () => {
        video.pause();
        ScrollTrigger.create({
          trigger: scene,
          start: 'top top',
          end: '+=' + window.innerHeight * 2,
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            if (video.duration) video.currentTime = self.progress * video.duration;
          },
        });
      };
      if (video.readyState >= 1) wire();
      else video.addEventListener('loadedmetadata', wire, { once: true });
    } else {
      // Touch: play only while in view to save battery/data.
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? void video.play().catch(() => {}) : video.pause())),
        { threshold: 0.25 },
      );
      io.observe(video);
    }
  });
}

/* Pull-quote: slow parallax drift on the full-bleed background. */
function initPullQuotes(fine: boolean): void {
  if (!fine) return;
  gsap.utils.toArray<HTMLElement>('.scene-quote [data-quote-bg]').forEach((bg) => {
    gsap.fromTo(
      bg,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: bg.closest('.scene-quote'), start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/* Expedition HUD: reflects the place / coordinates / day of the chapter in view.
   Uses IntersectionObserver so it runs even under reduced-motion. */
function initHud(): void {
  const hud = document.getElementById('expedition-hud');
  if (!hud) return;
  const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-place]'));
  if (!chapters.length) {
    hud.hidden = true;
    return;
  }

  const placeEl = hud.querySelector('[data-hud-place]');
  const coordEl = hud.querySelector('[data-hud-coord]');
  const metaEl = hud.querySelector('[data-hud-meta]');

  const apply = (el: HTMLElement) => {
    if (placeEl) placeEl.textContent = el.dataset.place ?? '';
    if (coordEl) coordEl.textContent = el.dataset.coord ?? '';
    if (metaEl) metaEl.textContent = el.dataset.meta ?? '';
  };

  apply(chapters[0]);
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e) => apply(e.target as HTMLElement));
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  chapters.forEach((c) => io.observe(c));
}
