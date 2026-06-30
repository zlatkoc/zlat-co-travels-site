/* ---------------------------------------------------------------------------
   Gallery lightbox. Click (or keyboard-activate) a photo to open it fullscreen;
   navigate within that gallery with ←/→, swipe, the prev/next buttons, or close
   with Esc / backdrop / ×. One shared overlay is reused by every gallery.
   The lightbox requests a larger version of the hotlinked image by bumping the
   `w=` query param (works for Unsplash/Pexels) — no extra URLs to store.
--------------------------------------------------------------------------- */
interface Shot {
  full: string;
  caption: string;
}

const upscale = (url: string, w = 2000): string => {
  try {
    const u = new URL(url, location.href);
    if (u.searchParams.has('w')) {
      u.searchParams.set('w', String(w));
      return u.toString();
    }
  } catch {
    /* leave as-is */
  }
  return url;
};

export function initGallery(): void {
  const galleries = Array.from(document.querySelectorAll<HTMLElement>('[data-gallery]'));
  if (!galleries.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Photo viewer');
  overlay.hidden = true;
  overlay.innerHTML = `
    <button class="lb-btn lb-close" type="button" aria-label="Close">×</button>
    <button class="lb-btn lb-nav lb-prev" type="button" aria-label="Previous photo">‹</button>
    <figure class="lb-stage">
      <img class="lb-img" alt="" />
      <figcaption class="lb-cap"></figcaption>
    </figure>
    <button class="lb-btn lb-nav lb-next" type="button" aria-label="Next photo">›</button>
    <span class="lb-count" aria-hidden="true"></span>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lb-img') as HTMLImageElement;
  const capEl = overlay.querySelector('.lb-cap') as HTMLElement;
  const countEl = overlay.querySelector('.lb-count') as HTMLElement;

  let shots: Shot[] = [];
  let index = 0;
  let lastFocus: HTMLElement | null = null;

  const show = (i: number): void => {
    index = (i + shots.length) % shots.length;
    const shot = shots[index];
    imgEl.src = upscale(shot.full);
    imgEl.alt = shot.caption;
    capEl.textContent = shot.caption;
    capEl.hidden = !shot.caption;
    countEl.textContent = `${index + 1} / ${shots.length}`;
  };

  const open = (gallery: HTMLElement, startIndex: number): void => {
    const buttons = Array.from(gallery.querySelectorAll<HTMLElement>('[data-gallery-item]'));
    shots = buttons.map((b) => ({ full: b.dataset.full ?? '', caption: b.dataset.caption ?? '' }));
    if (!shots.length) return;
    lastFocus = document.activeElement as HTMLElement;
    overlay.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    show(startIndex);
    (overlay.querySelector('.lb-close') as HTMLElement).focus();
  };

  const close = (): void => {
    overlay.hidden = true;
    document.documentElement.style.overflow = '';
    imgEl.removeAttribute('src');
    lastFocus?.focus();
  };

  galleries.forEach((g) => {
    g.querySelectorAll<HTMLElement>('[data-gallery-item]').forEach((btn) => {
      btn.addEventListener('click', () => open(g, Number(btn.dataset.index) || 0));
    });
  });

  overlay.querySelector('.lb-close')!.addEventListener('click', close);
  overlay.querySelector('.lb-prev')!.addEventListener('click', () => show(index - 1));
  overlay.querySelector('.lb-next')!.addEventListener('click', () => show(index + 1));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // Touch swipe.
  let startX = 0;
  overlay.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true },
  );
  overlay.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    },
    { passive: true },
  );
}
