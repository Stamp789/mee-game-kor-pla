const track = document.querySelector<HTMLElement>('[data-journey]');
if (track) {
  const root = track;
  const stage = root.querySelector<HTMLElement>('.journey-stage')!;
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const toggle = root.querySelector<HTMLButtonElement>('.journey-motion')!;
  const label = root.querySelector<HTMLElement>('[data-journey-motion-label]')!;
  const captions = [...root.querySelectorAll<HTMLElement>('[data-chapter]')];
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false, visible = false, loading = false, disposed = false, failed = false;
  let allowReducedMotion = false, progress = 0, activeChapter = -1, scrollFrame = 0;
  let viewportWidth = 0;
  let scene: { setRunning: (value: boolean) => void; setProgress: (value: number) => void; dispose: () => void } | undefined;
  try { paused = localStorage.getItem('modthai-motion') === 'paused'; } catch { /* Storage is optional. */ }
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const smooth = (a: number, b: number, value: number) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); };
  const still = () => failed || (systemMotion.matches && !allowReducedMotion);
  function sync() {
    root.dataset.mode = still() ? 'still' : 'journey';
    root.dataset.paused = String(paused || still());
    toggle.setAttribute('aria-pressed', String(paused || still()));
    toggle.setAttribute('aria-label', paused || still() ? 'เปิดการเคลื่อนไหว' : 'พักการเคลื่อนไหว');
    label.textContent = failed ? 'ภาพสำรอง' : still() ? 'เปิดฉาก 3D' : paused ? 'เปิดการเคลื่อนไหว' : 'พักฉาก';
    toggle.disabled = failed;
    scene?.setRunning(!paused && !still() && visible && !document.hidden && !disposed);
  }
  function displayProgress(displayed: number) {
    const intro = 1 - smooth(.06, .25, displayed);
    const passage = smooth(.24, .36, displayed) * (1 - smooth(.58, .7, displayed));
    const worlds = smooth(.7, .83, displayed);
    stage.style.setProperty('--journey-progress', String(displayed));
    stage.style.setProperty('--intro-opacity', String(intro));
    stage.style.setProperty('--passage-opacity', String(passage));
    stage.style.setProperty('--worlds-opacity', String(worlds));
    const chapter = displayed < .29 ? 0 : displayed < .72 ? 1 : 2;
    if (chapter !== activeChapter) {
      activeChapter = chapter;
      captions.forEach((caption, index) => { caption.inert = index !== chapter; caption.setAttribute('aria-hidden', String(index !== chapter)); });
      const cue = root.querySelector<HTMLElement>('[data-intro-cue]')!;
      cue.inert = chapter !== 0;
      cue.setAttribute('aria-hidden', String(chapter !== 0));
      root.querySelector('.journey-chapter-label')!.textContent = ['01 / THE ORIGIN', '02 / BEYOND THE WORDS', '03 / NEW WORLDS'][chapter];
      root.dataset.chapter = String(chapter);
    }
  }
  function updateScroll() {
    scrollFrame = 0;
    const nextWidth = document.documentElement.clientWidth;
    if (nextWidth !== viewportWidth) {
      viewportWidth = nextWidth;
      // Only the scene extends beyond the reading column on wide desktops.
      root.style.setProperty('--journey-bleed', `${Math.max(0, (nextWidth - 1920) / 2)}px`);
    }
    const rect = root.getBoundingClientRect();
    progress = still() ? 0 : clamp(-rect.top / Math.max(1, rect.height - stage.clientHeight));
    root.dataset.progress = progress.toFixed(3);
    if (scene && !failed) scene.setProgress(progress);
    else displayProgress(progress);
  }
  function queueScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
  async function start() {
    sync(); updateScroll();
    if (scene || loading || disposed || still() || !visible) return;
    loading = true;
    try {
      const { createJourneyScene } = await import('../scenes/hero/journey-scene');
      if (disposed) return;
      scene = await createJourneyScene(stage, root.dataset.images || '[]', displayProgress);
      if (disposed) { scene.dispose(); return; }
      scene.setProgress(progress); root.dataset.scene = 'ready'; sync();
    } catch {
      failed = true; root.dataset.scene = 'poster'; sync(); updateScroll();
    } finally { loading = false; }
  }
  toggle.addEventListener('click', () => {
    if (still()) { allowReducedMotion = true; paused = false; } else paused = !paused;
    try { localStorage.setItem('modthai-motion', paused ? 'paused' : 'running'); } catch { /* Keep the in-memory preference. */ }
    void start();
  });
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); if (visible) void start(); });
  observer.observe(root);
  const resize = new ResizeObserver(queueScroll); resize.observe(root);
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  document.addEventListener('visibilitychange', sync);
  systemMotion.addEventListener('change', () => { allowReducedMotion = false; void start(); });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); scene?.setRunning(false); failed = true; root.dataset.scene = 'poster'; sync(); updateScroll(); });
  window.addEventListener('pagehide', event => {
    if (event.persisted) { scene?.setRunning(false); return; }
    disposed = true; observer.disconnect(); resize.disconnect(); cancelAnimationFrame(scrollFrame);
    window.removeEventListener('scroll', queueScroll); window.removeEventListener('resize', queueScroll); scene?.dispose();
  });
  window.addEventListener('pageshow', () => { sync(); updateScroll(); });
  sync(); updateScroll();
}
