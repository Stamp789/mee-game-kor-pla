// A small shared motion layer. Native scrolling and real links stay in control.
const page = document.body.dataset.page;
if (page === 'catalog' || page === 'detail') {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
  const canvas = document.querySelector<HTMLCanvasElement>('.page-particles')!;
  const context = canvas.getContext('2d');
  const art = document.querySelector<HTMLElement>('.detail-visual');
  const sections = [...document.querySelectorAll<HTMLElement>('.detail-section[id]')];
  const nav = [...document.querySelectorAll<HTMLAnchorElement>('.detail-nav a[href^="#"]')];
  const surfaces = [...document.querySelectorAll<HTMLElement>('.game-art,.download-panel,.detail-visual')];
  const revealTargets = [...document.querySelectorAll<HTMLElement>(
    '.archive-hero>div,.archive-toolbar,.archive-results-heading,.archive-card,.detail-heading>div,.detail-visual,.detail-section,.download-panel,.related-section .section-heading,.related-section .game-card',
  )];
  const cards = [...document.querySelectorAll<HTMLElement>('.archive-card')];
  let frame = 0, stopped = false, scrollTarget = window.scrollY, scrollPosition = scrollTarget;
  let lastTime = 0, lastPaint = 0, width = innerWidth, height = innerHeight;
  let active: HTMLElement | undefined;
  let surfaceBounds: DOMRect | undefined;
  let lightX = .5, lightY = .5;
  let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
  let catalogSignature = '';
  let currentSection = '';
  let lastScrollPaint = Number.NaN;
  let lastPointerPaint = '';
  let hoverSettled = true;
  let observer: IntersectionObserver | undefined;
  let artTop = 0, documentHeight = 1;
  let sectionOffsets: { id: string; top: number }[] = [];
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // Fixed seeded positions prevent a different constellation on every redraw.
  const particles = Array.from({ length: 64 }, (_, index) => ({
    x: ((index * 127.37 + 31) % 997) / 997,
    y: ((index * 83.19 + 17) % 991) / 991,
    size: .6 + (index % 5) * .24,
    speed: 1.4 + (index % 7) * .46,
    phase: index * 1.7,
  }));
  // Cache soft glows; drawing only 64 small sprites keeps the field inexpensive.
  const sprites = ['#b2e9ff', '#c8baff', '#ffe4ae'].map(color => {
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 48;
    const ctx = sprite.getContext('2d');
    if (ctx) {
      const glow = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
      glow.addColorStop(0, '#ffffff'); glow.addColorStop(.12, color); glow.addColorStop(.4, `${color}55`); glow.addColorStop(1, `${color}00`);
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 48, 48);
    }
    return sprite;
  });

  function measure() {
    width = innerWidth; height = innerHeight;
    documentHeight = Math.max(1, document.documentElement.scrollHeight - height);
    if (art) artTop = art.getBoundingClientRect().top + scrollY;
    sectionOffsets = sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top + scrollY }));
    // Soft background points do not need a full Retina / 4K framebuffer.
    const ratio = Math.min(devicePixelRatio || 1, 1.25, 1920 / width);
    const nextWidth = Math.round(width * ratio), nextHeight = Math.round(height * ratio);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth; canvas.height = nextHeight;
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    lastScrollPaint = Number.NaN;
  }
  function reveal(element: HTMLElement, delay = 0) {
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.classList.add('motion-reveal');
    observer?.observe(element);
  }
  function resetSurface() {
    if (!active) return;
    active.classList.remove('is-hovered');
    ['--tilt-x','--tilt-y','--image-x','--image-y'].forEach(key => active?.style.removeProperty(key));
    active = undefined;
    surfaceBounds = undefined; hoverSettled = true; lastPointerPaint = '';
  }
  surfaces.forEach(surface => {
    surface.dataset.lightSurface = '';
    const glow = document.createElement('span'); glow.className = 'surface-glow'; glow.setAttribute('aria-hidden', 'true'); surface.append(glow);
    surface.addEventListener('pointermove', event => {
      if (reduced.matches || !desktop.matches || event.pointerType === 'touch') return;
      if (active !== surface) {
        resetSurface(); active = surface; smoothX = smoothY = 0;
        // Cache before tilting to avoid feedback from the transformed bounds.
        surfaceBounds = surface.getBoundingClientRect();
      }
      const rect = surfaceBounds!;
      pointerX = clamp((event.clientX - rect.left) / rect.width, 0, 1) - .5;
      pointerY = clamp((event.clientY - rect.top) / rect.height, 0, 1) - .5;
      lightX = pointerX + .5; lightY = pointerY + .5; hoverSettled = false;
      surface.classList.add('is-hovered');
    });
    surface.addEventListener('pointerleave', resetSurface);
  });

  function catalogChanged() {
    const visible = cards.filter(card => !card.hidden);
    const signature = `${document.querySelector('.archive-results')?.getAttribute('data-view')}:${visible.map(card => card.dataset.id).join(',')}`;
    if (signature === catalogSignature) return;
    catalogSignature = signature;
    resetSurface();
    if (!reduced.matches) visible.forEach((card, index) => {
      observer?.unobserve(card); card.classList.remove('is-revealed');
      reveal(card, (index % 3) * 65);
    });
    measure();
  }
  function configure() {
    observer?.disconnect();
    resetSurface();
    root.classList.toggle('motion-ready', !reduced.matches);
    revealTargets.forEach(element => element.classList.remove('motion-reveal', 'is-revealed'));
    if (!reduced.matches) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed'); observer?.unobserve(entry.target);
        });
      }, { threshold: .04, rootMargin: '0px 0px -20px 0px' });
      revealTargets.forEach((element, index) => reveal(element, element.matches('.game-card') ? (index % 3) * 65 : 0));
    }
    measure();
    if (reduced.matches && context) context.clearRect(0, 0, width, height);
    start();
  }
  function draw(time: number) {
    if (!context || time - lastPaint < 32) return;
    lastPaint = time;
    context.clearRect(0, 0, width, height);
    const seconds = time / 1000;
    particles.forEach((particle, index) => {
      const x = particle.x * width + Math.sin(seconds * .12 + particle.phase) * 13;
      const rawY = particle.y * height - seconds * particle.speed - scrollPosition * (.035 + index % 3 * .025);
      const y = ((rawY % height) + height) % height;
      const size = particle.size * 8;
      context.globalAlpha = .24 + (Math.sin(seconds * .55 + particle.phase) + 1) * .16;
      context.drawImage(sprites[index % 3], x - size / 2, y - size / 2, size, size);
    });
    context.globalAlpha = 1;
  }
  function tick(time: number) {
    frame = 0;
    const dt = Math.min((time - (lastTime || time)) / 1000, .05); lastTime = time;
    const follow = 1 - Math.exp(-9 * dt);
    scrollPosition += (scrollTarget - scrollPosition) * follow;
    if (Math.abs(scrollTarget - scrollPosition) < .02) scrollPosition = scrollTarget;
    const scrollChanged = !Number.isFinite(lastScrollPaint) || Math.abs(scrollPosition - lastScrollPaint) >= .01;
    if (scrollChanged) {
      lastScrollPaint = scrollPosition;
      root.style.setProperty('--page-progress', clamp(scrollTarget / documentHeight, 0, 1).toFixed(4));
      if (!reduced.matches && desktop.matches) {
        root.style.setProperty('--field-drift', `${(-scrollPosition * .045).toFixed(2)}px`);
        root.style.setProperty('--orbit-turn', `${(scrollPosition * .026).toFixed(2)}deg`);
        root.style.setProperty('--title-drift', `${(-Math.min(scrollPosition * .07, 28)).toFixed(2)}px`);
        if (art) art.style.setProperty('--art-drift', `${clamp((scrollPosition - artTop + height * .35) * .07, -24, 24).toFixed(2)}px`);
      }
    }
    if (!reduced.matches && desktop.matches) {
      if (active && !hoverSettled) {
        smoothX += (pointerX - smoothX) * (1 - Math.exp(-13 * dt));
        smoothY += (pointerY - smoothY) * (1 - Math.exp(-13 * dt));
        const signature = `${smoothX.toFixed(3)}:${smoothY.toFixed(3)}:${lightX.toFixed(3)}:${lightY.toFixed(3)}`;
        if (signature !== lastPointerPaint) {
          lastPointerPaint = signature;
          active.style.setProperty('--light-x', `${(lightX * 100).toFixed(1)}%`);
          active.style.setProperty('--light-y', `${(lightY * 100).toFixed(1)}%`);
          active.style.setProperty('--tilt-x', `${(-smoothY * 7).toFixed(3)}deg`);
          active.style.setProperty('--tilt-y', `${(smoothX * 9).toFixed(3)}deg`);
          active.style.setProperty('--image-x', `${(smoothX * -10).toFixed(2)}px`);
          active.style.setProperty('--image-y', `${(smoothY * -8).toFixed(2)}px`);
        }
        hoverSettled = Math.abs(pointerX - smoothX) + Math.abs(pointerY - smoothY) < .001;
      }
      draw(time);
    }
    if (sections.length) {
      let chosen = sectionOffsets[0]?.id || '';
      sectionOffsets.forEach(section => { if (section.top <= scrollTarget + 235) chosen = section.id; });
      if (chosen !== currentSection) {
        currentSection = chosen;
        nav.forEach(link => { const selected = link.hash === `#${chosen}`; link.classList.toggle('is-current', selected); if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      }
    }
    const settling = Math.abs(scrollTarget - scrollPosition) > .1;
    if (!stopped && !document.hidden && ((!reduced.matches && desktop.matches) || settling)) frame = requestAnimationFrame(tick);
  }
  function start() { if (!frame && !stopped && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(tick); } }
  window.addEventListener('scroll', () => { scrollTarget = window.scrollY; resetSurface(); start(); }, { passive: true });
  window.addEventListener('resize', () => { measure(); start(); }, { passive: true });
  document.addEventListener('catalog-rendered', catalogChanged);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; resetSurface(); }
    else { scrollTarget = scrollY; start(); }
  });
  window.addEventListener('pagehide', () => { stopped = true; cancelAnimationFrame(frame); frame = 0; observer?.disconnect(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { stopped = false; scrollTarget = scrollPosition = scrollY; configure(); } });
  reduced.addEventListener('change', configure);
  desktop.addEventListener('change', () => { resetSurface(); measure(); start(); });
  // Images and webfonts may change offsets without a viewport resize.
  const layoutObserver = new ResizeObserver(() => { measure(); start(); });
  layoutObserver.observe(document.querySelector('main')!);
  configure();
  catalogSignature = `${document.querySelector('.archive-results')?.getAttribute('data-view')}:${cards.filter(card => !card.hidden).map(card => card.dataset.id).join(',')}`;
}
