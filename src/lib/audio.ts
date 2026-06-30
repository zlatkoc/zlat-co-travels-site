/* ---------------------------------------------------------------------------
   Trip audio. Owns playback of autoplay videos ([data-autoplay-video]) so video
   and audio never fight over the same element. Modes (read from #sound-toggle):

     none      — videos autoplay muted in view; no sound UI.
     track     — one looping <audio id="trip-audio"> for the page; videos stay muted.
                 The toggle starts/stops it (first start needs the tap = user gesture).
     per-video — videos autoplay muted; after one tap the most-visible video is
                 unmuted, the rest muted. Scrolling switches which one has sound.

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
  const ratios = new Map<HTMLVideoElement, number>();

  // The video that should currently carry sound (per-video mode, sound enabled).
  const audibleVideo = (): HTMLVideoElement | null => {
    if (mode !== 'per-video' || !soundOn) return null;
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
    const audible = audibleVideo();
    for (const v of videos) {
      const inView = (ratios.get(v) ?? 0) > 0;
      const isAudible = v === audible;
      v.muted = !isAudible;
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
        render();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    videos.forEach((v) => io.observe(v));
  }

  if (!toggle || mode === 'none') return;

  const track = mode === 'track' ? (document.getElementById('trip-audio') as HTMLAudioElement | null) : null;
  const word = mode === 'track' ? 'Music' : 'Sound';

  const sync = (): void => {
    toggle.setAttribute('aria-pressed', String(soundOn));
    toggle.setAttribute('aria-label', `${word}: ${soundOn ? 'on' : 'off'}`);
    toggle.classList.toggle('is-on', soundOn);
    const text = toggle.querySelector('[data-sound-text]');
    if (text) text.textContent = `${word} ${soundOn ? 'on' : 'off'}`;
    const off = toggle.querySelector<HTMLElement>('[data-ico-off]');
    const on = toggle.querySelector<HTMLElement>('[data-ico-on]');
    if (off) off.hidden = soundOn;
    if (on) on.hidden = !soundOn;
  };

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    soundOn = !soundOn;
    if (track) {
      if (soundOn) void track.play().catch(() => {});
      else track.pause();
    }
    sync();
    render(); // unmute the current video inside the gesture
  });
}
