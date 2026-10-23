const root = document.querySelector<HTMLElement>('[data-immersive-world]');
if (root) {
  const toggle = root.querySelector<HTMLButtonElement>('.ambient-toggle')!;
  const label = root.querySelector<HTMLElement>('[data-motion-label]')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  try { paused ||= localStorage.getItem('modthai-motion') === 'paused'; } catch { /* Use system preference. */ }
  let visible = true, disposed = false, loading = false, failed = false, selected = 0;
  let scene: { setRunning: (value: boolean) => void; setWorld: (index: number) => void; dispose: () => void } | undefined;
  const update = () => {
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'เปิดการเคลื่อนไหว' : 'พักการเคลื่อนไหว');
    label.textContent = paused ? 'ภาพนิ่ง' : 'เคลื่อนไหว';
    root.dataset.paused = String(paused);
    scene?.setRunning(!paused && visible && !document.hidden && !disposed);
  };
  async function start() {
    update();
    if (scene || loading || disposed || failed || !visible || paused) return;
    loading = true;
    try {
      const { createPortalScene } = await import('../scenes/hero/portal-scene');
      if (disposed) return;
      scene = await createPortalScene(root!);
      if (disposed) { scene.dispose(); return; }
      scene.setWorld(selected); root!.dataset.scene = 'ready'; update();
    } catch {
      failed = true; root!.dataset.scene = 'poster'; label.textContent = 'ภาพนิ่ง'; toggle.disabled = true;
      toggle.setAttribute('aria-label', 'แสดงภาพนิ่ง เนื่องจากฉากสามมิติไม่พร้อมใช้งาน');
    } finally { loading = false; }
  }
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-world]')];
  const links: string[] = JSON.parse(root.querySelector<HTMLElement>('[data-world-link]')!.dataset.links || '[]');
  const images: string[] = JSON.parse(root.dataset.images || '[]');
  const selectWorld = (index: number) => {
    selected = index;
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === index)));
    root.querySelector('[data-world-index]')!.textContent = String(index + 1).padStart(2, '0');
    root.querySelector('[data-world-title]')!.textContent = tabs[index].querySelector('span')!.textContent;
    root.querySelector<HTMLAnchorElement>('[data-world-link]')!.href = links[index];
    root.querySelector<HTMLImageElement>('.poster-window img')!.src = images[index];
    scene?.setWorld(index);
  };
  tabs.forEach((tab, i) => tab.addEventListener('click', () => selectWorld(i)));
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('modthai-motion', paused ? 'paused' : 'running'); } catch { /* Continue in memory. */ }
    void start();
  });
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); if (visible) void start(); });
  observer.observe(root);
  motion.addEventListener('change', event => { paused = event.matches; void start(); });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', event => {
    if (event.persisted) { scene?.setRunning(false); return; }
    disposed = true; observer.disconnect(); scene?.dispose();
  });
  window.addEventListener('pageshow', () => { update(); void start(); });
  root.querySelector('canvas')!.addEventListener('webglcontextlost', event => {
    event.preventDefault(); scene?.setRunning(false); root.dataset.scene = 'poster';
    failed = true; label.textContent = 'ภาพนิ่ง'; toggle.disabled = true;
  });
  update();
}
