const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const root = document.documentElement;

/* Lights (theme) toggle */
const toggle = document.querySelector<HTMLButtonElement>('.lights-toggle');
const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
function syncToggle() {
  if (!toggle) return;
  const dark = isDark();
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'เปลี่ยนเป็นโหมดกลางวัน' : 'เปลี่ยนเป็นโหมดกลางคืน');
}
syncToggle();
toggle?.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('shop-theme', next); } catch { /* storage blocked */ }
  syncToggle();
});

/* Header floats transparently over the 3D ring on the homepage */
const ringHero = document.querySelector<HTMLElement>('[data-box-ring]');
const headerEl = document.querySelector<HTMLElement>('.site-header');
if (ringHero && headerEl) {
  const sync = () => headerEl.classList.toggle('over-hero', scrollY < ringHero.offsetHeight - headerEl.offsetHeight);
  addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
}

/* Subtle 3D tilt on the game-page cover */
const tilt = document.querySelector<HTMLElement>('[data-tilt]');
if (tilt && finePointer && !reduced) {
  tilt.addEventListener('pointermove', event => {
    const r = tilt.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - .5, y = (event.clientY - r.top) / r.height - .5;
    tilt.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(10px)`;
  });
  tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
}

/* Firefly motes drifting upward */
const motes = document.querySelector<HTMLCanvasElement>('canvas.motes');
const ctx = motes?.getContext('2d');
if (motes && ctx && !reduced) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let w = 0, h = 0, raf = 0;
  type Mote = { x: number; y: number; r: number; vy: number; phase: number; hue: number };
  let list: Mote[] = [];
  const spawn = (anywhere: boolean): Mote => ({ x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, r: .6 + Math.random() * 1.8, vy: .15 + Math.random() * .45, phase: Math.random() * Math.PI * 2, hue: Math.random() < .6 ? 44 : 24 });
  const resize = () => {
    w = innerWidth; h = innerHeight;
    motes.width = w * dpr; motes.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, w * h / 22000));
    list = Array.from({ length: count }, () => spawn(true));
  };
  const sprite = (hue: number) => {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const s = c.getContext('2d')!; const g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `hsla(${hue}, 95%, 82%, 1)`); g.addColorStop(.25, `hsla(${hue}, 90%, 65%, .55)`); g.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);
    s.fillStyle = g; s.fillRect(0, 0, 32, 32); return c;
  };
  const sprites: Record<number, HTMLCanvasElement> = { 44: sprite(44), 24: sprite(24) };
  const frame = (t: number) => {
    ctx.clearRect(0, 0, w, h);
    for (const m of list) {
      m.y -= m.vy; m.x += Math.sin(t / 1600 + m.phase) * .25;
      if (m.y < -10) Object.assign(m, spawn(false));
      ctx.globalAlpha = .35 + .65 * Math.sin(t / 700 + m.phase) ** 2;
      const size = m.r * 8;
      ctx.drawImage(sprites[m.hue], m.x - size / 2, m.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };
  resize(); addEventListener('resize', resize);
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(frame); });
}

/* Header shadow after scroll */
const header = document.querySelector<HTMLElement>('.site-header');
const onScrollHeader = () => header?.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();

/* Cursor tag */
const tag = document.querySelector<HTMLElement>('.cursor-tag');
if (tag && finePointer) {
  const label = tag.querySelector('span')!;
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => { x += (tx - x) * .22; y += (ty - y) * .22; tag.style.transform = `translate3d(${x}px,${y}px,0)`; raf = Math.abs(tx - x) + Math.abs(ty - y) > .3 ? requestAnimationFrame(loop) : 0; };
  addEventListener('pointermove', event => { tx = event.clientX; ty = event.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  document.addEventListener('pointerover', event => {
    const target = (event.target as Element).closest<HTMLElement>('[data-cursor]');
    if (target) { label.textContent = target.dataset.cursor!; tag.classList.add('on'); } else tag.classList.remove('on');
  });
}

/* Hero rotator */
const rotator = document.querySelector<HTMLElement>('[data-hero-rotator]');
if (rotator) {
  const images = [...rotator.querySelectorAll<HTMLImageElement>('.hero-frame img')];
  const link = rotator.querySelector<HTMLAnchorElement>('[data-hero-link]')!;
  const set = (key: string, value: string) => { const el = rotator.querySelector(`[data-hero-${key}]`); if (el) el.textContent = value; };
  let index = 0, timer = 0;
  const show = (next: number) => {
    images[index].classList.remove('is-on'); images[index].alt = '';
    index = next; const img = images[index];
    img.loading = 'eager'; img.classList.add('is-on'); img.alt = `ภาพปก ${img.dataset.title}`;
    link.href = img.dataset.href!;
    set('index', String(index + 1).padStart(2, '0')); set('title', img.dataset.title!); set('thai', img.dataset.thai!); set('code', img.dataset.code!); set('build', img.dataset.build!);
  };
  const start = () => { stop(); if (images.length > 1) timer = window.setInterval(() => show((index + 1) % images.length), reduced ? 7000 : 4200); };
  const stop = () => clearInterval(timer);
  start();
  rotator.addEventListener('pointerenter', stop); rotator.addEventListener('pointerleave', start);
  rotator.addEventListener('focusin', stop); rotator.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
}

/* Corridor: vertical scroll drives horizontal track on wide screens */
const corridor = document.querySelector<HTMLElement>('[data-corridor]');
if (corridor) {
  const track = corridor.querySelector<HTMLElement>('.corridor-track')!;
  const bar = corridor.querySelector<HTMLElement>('.corridor-progress span');
  const wide = matchMedia('(min-width: 900px)');
  let distance = 0, ticking = false;
  const measure = () => {
    const pinned = wide.matches && !reduced;
    corridor.classList.toggle('is-pinned', pinned);
    track.style.transform = '';
    if (!pinned) { corridor.style.height = ''; return; }
    distance = Math.max(0, track.scrollWidth - innerWidth + 48);
    corridor.style.height = `${innerHeight + distance}px`;
    update();
  };
  const update = () => {
    ticking = false;
    if (!corridor.classList.contains('is-pinned')) return;
    const rect = corridor.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    track.style.transform = `translate3d(${-progress * distance}px,0,0)`;
    if (bar) bar.style.transform = `scaleX(${progress})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', measure); wide.addEventListener('change', measure);
  addEventListener('load', measure); measure();
}

/* Index wall hover preview */
const preview = document.querySelector<HTMLElement>('.index-preview');
if (preview && finePointer) {
  const img = preview.querySelector('img')!;
  document.querySelectorAll<HTMLAnchorElement>('.index-cloud a').forEach(link => {
    link.addEventListener('pointerenter', () => { img.src = link.dataset.preview!; preview.classList.add('on'); });
    link.addEventListener('pointerleave', () => preview.classList.remove('on'));
    link.addEventListener('pointermove', event => { preview.style.transform = `translate3d(${event.clientX + 24}px,${event.clientY - 90}px,0) rotate(-3deg)`; });
  });
}

/* Reveal-on-scroll */
if (!reduced && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll<HTMLElement>('.case, .notice, .sign-head, .poster');
  const io = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('shown'); io.unobserve(entry.target); } }), { rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => { el.classList.add('reveal'); io.observe(el); });
  // Catalog re-renders may unhide cards; make sure they are visible.
  document.addEventListener('catalog-rendered', () => document.querySelectorAll('.case.reveal:not(.shown)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('shown'); }));
}

/* Mark the current game page as a visited town on the world map */
const townPage = document.querySelector<HTMLElement>('[data-town-id]');
if (townPage) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem('visited-towns') || '[]');
    if (!list.includes(townPage.dataset.townId!)) localStorage.setItem('visited-towns', JSON.stringify([...list, townPage.dataset.townId]));
  } catch { /* storage blocked */ }
}
