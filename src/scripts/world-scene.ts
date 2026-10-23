const root = document.querySelector<HTMLElement>('[data-world-scene]');
if (root) {
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const button = root.querySelector<HTMLButtonElement>('.motion-button')!;
  const label = button.querySelector('span')!;
  const hint = root.querySelector<HTMLElement>('.stage-hint')!;
  let preference: string | null = null;
  try { preference = localStorage.getItem('modthai-motion'); } catch { /* Browser may disable storage. */ }
  let paused = preference === 'paused' || motionQuery.matches;
  let visible = false;
  let loading = false;
  let disposed = false;
  let failed = false;
  let scene: { setRunning: (running: boolean) => void; dispose: () => void } | undefined;
  function updateButton() {
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'เปิดฉากสามมิติ' : 'พักฉากสามมิติ');
    label.textContent = paused ? 'เปิดฉากสามมิติ' : 'พักการเคลื่อนไหว';
  }
  async function sync() {
    updateButton();
    const running = !paused && visible && !document.hidden && !disposed;
    if (scene) { scene.setRunning(running); return; }
    if (!running || loading || failed) return;
    loading = true;
    try {
      const { createWorldScene } = await import('../scenes/hero/create-scene');
      if (disposed) return;
      scene = await createWorldScene(root!);
      if (disposed) { scene.dispose(); return; }
      scene.setRunning(!paused && visible && !document.hidden);
      root!.dataset.ready = 'true';
    } catch {
      failed = true;
      root!.dataset.ready = 'false';
      label.textContent = 'แสดงภาพสำรอง';
      button.disabled = true;
      hint.textContent = 'WORLDS, UNDERSTOOD.';
    } finally { loading = false; }
  }
  button.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('modthai-motion', paused ? 'paused' : 'running'); } catch { /* In-memory preference remains usable. */ }
    void sync();
  });
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; void sync(); }, { threshold: 0 });
  observer.observe(root);
  document.addEventListener('visibilitychange', () => void sync());
  motionQuery.addEventListener('change', event => { paused = event.matches; void sync(); });
  window.addEventListener('pagehide', event => {
    if (event.persisted) { scene?.setRunning(false); return; }
    disposed = true; observer.disconnect(); scene?.dispose();
  });
  window.addEventListener('pageshow', () => void sync());
  root.addEventListener('webglcontextlost', () => {
    scene?.setRunning(false); root.dataset.ready = 'false'; failed = true;
    label.textContent = 'แสดงภาพสำรอง'; button.disabled = true;
  }, true);
  updateButton();
}
