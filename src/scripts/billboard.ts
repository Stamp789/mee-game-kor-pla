type Game = { id: string; title: string; thai: string; cover: string; href: string; c0: string; c1: string; shots: string[]; date: string; version: string; tags: string };

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll<HTMLElement>('[data-billboard]').forEach(root => {
  const games: Game[] = JSON.parse(root.dataset.games || '[]');
  const kickers: string[] = JSON.parse(root.dataset.kickers || '[]');
  const detail = root.dataset.detail === '1';
  const $ = <T extends HTMLElement = HTMLElement>(key: string) => root.querySelector<T>(`[data-bb-${key}]`);
  const art = $<HTMLImageElement>('art')!, shot = $<HTMLImageElement>('shot')!;
  const crt = root.querySelector<HTMLElement>('.crt-screen')!;
  let index = 0, channel = 0, timer = 0, crtTimer = 0;

  function tune(src: string) {
    crt.classList.remove('tuning'); void crt.offsetWidth; crt.classList.add('tuning');
    setTimeout(() => { shot.src = src; }, reduced ? 0 : 160);
    channel++; const ch = $('ch'); if (ch) ch.textContent = String((channel % 99) + 1).padStart(2, '0');
  }

  function show(next: number) {
    index = (next + games.length) % games.length;
    const g = games[index];
    root.style.setProperty('--c0', g.c0); root.style.setProperty('--c1', g.c1);
    const canvas = root.querySelector<HTMLElement>('.bb-canvas')!;
    canvas.classList.remove('pasting'); void canvas.offsetWidth; canvas.classList.add('pasting');
    art.src = g.cover; art.alt = `ภาพปก ${g.title}`;
    $('thai')!.textContent = g.thai; $('title')!.textContent = g.title; $('tags')!.textContent = g.tags;
    $('kicker')!.textContent = kickers[index % kickers.length] || '';
    $('date')!.textContent = `เข้าฉาย ${g.date}`; $('version')!.textContent = g.version;
    const i = $('index'); if (i) i.textContent = String(index + 1);
    $<HTMLAnchorElement>('link')!.href = g.href;
    tune(g.shots[0] || g.cover);
  }

  const start = () => {
    stop();
    if (games.length > 1 && !reduced) timer = window.setInterval(() => show(index + 1), 7000);
    // single game: the CRT flips through that game's screenshots
    if (detail && !reduced && games[0].shots.length > 1) crtTimer = window.setInterval(() => { const s = games[0].shots; tune(s[channel % s.length]); }, 3600);
  };
  const stop = () => { clearInterval(timer); clearInterval(crtTimer); };
  // 3D tilt + parallax: the billboard follows the pointer.
  const board = root.querySelector<HTMLElement>('.billboard')!;
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    root.addEventListener('pointermove', event => {
      const r = board.getBoundingClientRect();
      const tx = Math.max(-1, Math.min(1, ((event.clientX - r.left) / r.width - .5) * 2));
      const ty = Math.max(-1, Math.min(1, ((event.clientY - r.top) / r.height - .5) * 2));
      board.style.setProperty('--tx', tx.toFixed(3)); board.style.setProperty('--ty', ty.toFixed(3));
      board.classList.add('tilting');
    });
    root.addEventListener('pointerleave', () => { board.style.setProperty('--tx', '0'); board.style.setProperty('--ty', '0'); board.classList.remove('tilting'); });
  }
  root.querySelectorAll<HTMLButtonElement>('[data-bb-step]').forEach(b => b.addEventListener('click', () => { show(index + Number(b.dataset.bbStep)); start(); }));
  root.addEventListener('pointerenter', () => { if (games.length > 1) clearInterval(timer); });
  root.addEventListener('pointerleave', start);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
});
