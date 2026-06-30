/* ---------------------------------------------------------------------------
   Trip audio. Owns playback of autoplay videos ([data-autoplay-video]) so video
   and audio never fight over the same element. Modes (read from #sound-toggle):

     none      — videos autoplay muted in view; no sound UI.
     track     — one looping <audio id="trip-audio"> for the page; videos stay muted.
                 The toggle starts/stops it (first start needs the tap = user gesture).
     per-video — videos autoplay muted; one tap enables sound on the active video
                 (the first video if none has been seen yet), the rest muted. The
                 active video keeps playing as a soundtrack until the next one scrolls in.

   Browser rule this works around: sound never starts without a user gesture. The
   single toggle tap is that gesture; after it, muting/unmuting is free.
   Reduced-motion: muted autoplay is skipped; sound still works on tap (it plays the
   in-view video on demand), so the poster shows until the viewer opts in.
--------------------------------------------------------------------------- */
type Mode = 'none' | 'track' | 'per-video';

export function initTripAudio(): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggle = document.getElementById('sound-toggle') as HTMLButtonElement | null;
  const mode = ((toggle?.dataset.mode as Mode) ?? 'none') as Mode;
  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('[data-autoplay-video]'));

  let soundOn = false;
  let unlocked = false;
  // The "active" video carries sound in per-video mode. It stays active even after
  // scrolling off-screen, so its audio continues over photos/text as a soundtrack,
  // until a different video scrolls into view and takes over.
  let activeVideo: HTMLVideoElement | null = null;
  const ratios = new Map<HTMLVideoElement, number>();

  const mostVisible = (): HTMLVideoElement | null => {
    let best: HTMLVideoElement | null = null;
    let bestRatio = 0;
    for (const [v, r] of ratios) {
      if (r > bestRatio) {
        best = v;
        bestRatio = r;
      }
    }
    return bestRatio > 0 ? best : null;
  };

  const render = (): void => {
    const audible = mode === 'per-video' && soundOn ? activeVideo : null;
    for (const v of videos) {
      const inView = (ratios.get(v) ?? 0) > 0;
      const isAudible = v === audible;
      v.muted = !isAudible;
      // The audible video keeps playing even off-screen (continuous soundtrack);
      // other videos only preview muted while they're in view.
      const shouldPlay = isAudible || (!reduced && inView);
      if (shouldPlay) {
        if (v.paused) void v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    }
  };

  if (videos.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target as HTMLVideoElement, e.isIntersecting ? e.intersectionRatio : 0);
        }
        const current = mostVisible();
        if (current) activeVideo = current; // sticky: only changes when a video is in view
        render();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    videos.forEach((v) => io.observe(v));
  }

  if (!toggle || mode === 'none') return;

  const track = mode === 'track' ? (document.getElementById('trip-audio') as HTMLAudioElement | null) : null;
  // Localized labels rendered server-side by SoundToggle.
  const labelOn = toggle.dataset.labelOn ?? 'Sound on';
  const labelOff = toggle.dataset.labelOff ?? 'Sound off';

  const sync = (): void => {
    const label = soundOn ? labelOn : labelOff;
    toggle.setAttribute('aria-pressed', String(soundOn));
    toggle.setAttribute('aria-label', label);
    toggle.classList.toggle('is-on', soundOn);
    const text = toggle.querySelector('[data-sound-text]');
    if (text) text.textContent = label;
    const off = toggle.querySelector<HTMLElement>('[data-ico-off]');
    const on = toggle.querySelector<HTMLElement>('[data-ico-on]');
    if (off) off.hidden = soundOn;
    if (on) on.hidden = !soundOn;
  };

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn && mode === 'per-video') {
      // "Unlock" every video within this gesture (a muted play) so playback/unmute
      // works on its own afterwards — required for iOS Safari.
      if (!unlocked) {
        unlocked = true;
        for (const v of videos) void v.play().catch(() => {});
      }
      // If no video has been seen yet (sound enabled at the top), start the first
      // one immediately so the viewer hears audio right away.
      if (!activeVideo && videos.length) activeVideo = videos[0];
    }
    if (track) {
      if (soundOn) void track.play().catch(() => {});
      else track.pause();
    }
    sync();
    render(); // settle playback/mute state inside the gesture
  });
}
