import { clamp, ease, sampleJourney, followScroll } from '../lib/journey-motion';

const journey = document.querySelector<HTMLElement>('[data-scroll-journey]');
const stage = journey?.querySelector<HTMLElement>('.game-showcase');
const hero = document.querySelector<HTMLElement>('.play-hero');
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-game-tab]')];
const panels = [...document.querySelectorAll<HTMLElement>('.showcase-panel')];
const copies = panels.map(panel => panel.querySelector<HTMLElement>('.showcase-copy')!);
const sharedBox = journey?.querySelector<HTMLElement>('[data-journey-box]');
const covers = [...document.querySelectorAll<HTMLElement>('[data-box-cover]')];
const motionButtons = [...document.querySelectorAll<HTMLButtonElement>('.motion-toggle')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const colorSpace = CSS.supports('background-color', 'color-mix(in oklab, red, blue)') ? 'oklab' : 'srgb';
const colors = tabs.map(tab => ({ color: tab.dataset.color!, accent: tab.dataset.accent! }));
let active = -1;
let enabled = false;
let frame = 0;
let progress = 0;
let velocity = 0;
let frontCover = -1;
let backCover = -1;
let lastTime = 0;
let start = 0;
let travel = 1;
let heroTop = 0;
let heroHeight = 1;

function mixColor(from: string, to: string, amount: number) {
  return `color-mix(in ${colorSpace}, ${from} ${((1 - amount) * 100).toFixed(5)}%, ${to})`;
}

function activate(index: number, focus = false, force = false) {
  if (!tabs[index] || !stage) return;
  if (active !== index || force) {
    active = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].dataset.active = String(i === index);
      panels[i].tabIndex = i === index ? 0 : -1;
      panels[i].inert = i !== index;
      panels[i].setAttribute('aria-hidden', String(i !== index));
      panels[i].hidden = !enabled && i !== index;
      panels[i].style.setProperty('--panel-opacity', i === index ? '1' : '0');
    });
    const number = String(index + 1).padStart(2, '0');
    const counter = stage.querySelector('.showcase-counter');
    if (counter) counter.textContent = `${number} / ${String(tabs.length).padStart(2, '0')}`;
    const watermark = stage.querySelector('.scene-watermark');
    if (watermark) watermark.textContent = number;
    journey!.dataset.scene = String(index + 1);
  }
  if (focus) tabs[index].focus({ preventScroll: true });
}

function measure() {
  if (!journey || !hero) return;
  start = journey.getBoundingClientRect().top + window.scrollY;
  travel = Math.max(1, journey.offsetHeight - window.innerHeight);
  heroTop = hero.getBoundingClientRect().top + window.scrollY;
  heroHeight = Math.max(1, hero.offsetHeight);
  if (enabled && stage) {
    stage.style.setProperty('--shared-copy-height', `${Math.ceil(Math.max(...copies.map(copy => copy.offsetHeight)))}px`);
  }
}

function render(value: number) {
  if (!journey || !stage || !enabled) return;
  const pose = sampleJourney(value, tabs.length);
  const { position } = pose;
  activate(pose.active);
  const lower = Math.min(tabs.length - 1, Math.floor(position));
  const upper = Math.min(tabs.length - 1, lower + 1);
  const blend = ease(position - lower);
  stage.style.setProperty('--stage-color', mixColor(colors[lower].color, colors[upper].color, blend));
  stage.style.setProperty('--stage-accent', mixColor(colors[lower].accent, colors[upper].accent, blend));
  stage.style.setProperty('--journey-progress', String(value));
  stage.style.setProperty('--orbit-turn', `${value * 150 - 15}deg`);
  journey.dataset.progress = value.toFixed(4);
  // Rotate this same physical box throughout the entire journey. Its reverse
  // face is prepared while hidden, so artwork never fades between two boxes.
  stage.style.setProperty('--scene-turn', `${pose.angle}deg`);
  stage.style.setProperty('--scene-tilt', `${pose.tilt}deg`);
  stage.style.setProperty('--scene-pitch', `${pose.pitch}deg`);
  stage.style.setProperty('--scene-rise', `${pose.rise}px`);
  stage.style.setProperty('--scene-drift', `${pose.drift}px`);
  stage.style.setProperty('--scene-scale', String(pose.scale));
  if (frontCover !== pose.front || backCover !== pose.back) {
    frontCover = pose.front;
    backCover = pose.back;
    covers.forEach(cover => {
      const index = Number(cover.dataset.boxCover);
      cover.dataset.visible = String(index === frontCover || index === backCover);
    });
    if (sharedBox) {
      sharedBox.dataset.front = String(frontCover);
      sharedBox.dataset.back = String(backCover);
    }
  }
  panels.forEach((panel, index) => {
    const distance = position - index;
    panel.style.setProperty('--copy-rise', `${clamp(distance, -.5, .5) * -20}px`);
    panel.style.setProperty('--copy-opacity', String(ease((.5 - Math.abs(distance)) / .16)));
    tabs[index].style.setProperty('--chapter-fill', String(clamp((position - index + .5))));
  });
}

function tick(time: number) {
  frame = 0;
  if (!enabled) return;
  const target = clamp((window.scrollY - start) / travel);
  const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
  lastTime = time;
  // Preserve angular velocity across scroll events, including direction changes.
  const following = followScroll(progress, velocity, target, elapsed / 1000);
  progress = clamp(following.value);
  velocity = following.velocity;
  if (Math.abs(target - progress) < .00002 && Math.abs(velocity) < .0002) {
    progress = target;
    velocity = 0;
  }
  render(progress);
  hero?.style.setProperty('--hero-scroll', String(clamp((window.scrollY - heroTop) / heroHeight)));
  if (progress !== target || velocity !== 0) frame = requestAnimationFrame(tick);
  else lastTime = 0;
}
function requestFrame() {
  if (enabled && !frame) frame = requestAnimationFrame(tick);
}

function selectGame(index: number, focus = false) {
  if (!tabs[index] || !stage) return;
  if (enabled) {
    measure();
    window.scrollTo({ top: start + index / Math.max(1, tabs.length - 1) * travel, behavior: 'smooth' });
    if (focus) tabs[index].focus({ preventScroll: true });
  } else {
    activate(index, focus);
    stage.style.setProperty('--stage-color', colors[index].color);
    stage.style.setProperty('--stage-accent', colors[index].accent);
  }
}

function setMotion(paused: boolean, fromControl = false) {
  if (!journey || !stage) return;
  const rect = journey.getBoundingClientRect();
  const isInside = rect.top <= 1 && rect.bottom > window.innerHeight - 1;
  enabled = !paused;
  document.body.classList.toggle('motion-paused', paused);
  document.body.classList.toggle('scroll-experience', enabled);
  journey.classList.toggle('is-scroll-driven', enabled);
  motionButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(paused));
    button.innerHTML = `${paused ? 'เปิดภาพเคลื่อนไหว' : 'หยุดภาพเคลื่อนไหว'} <span>${paused ? '▷' : 'Ⅱ'}</span>`;
  });
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  velocity = 0;
  activate(Math.max(0, active), false, true);
  measure();
  if (fromControl && isInside) {
    window.scrollTo({ top: start + (enabled ? active / Math.max(1, tabs.length - 1) * travel : 0), behavior: 'instant' });
  }
  progress = clamp((window.scrollY - start) / travel);
  if (enabled) requestFrame();
  else {
    stage.style.setProperty('--stage-color', colors[active].color);
    stage.style.setProperty('--stage-accent', colors[active].accent);
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectGame(index));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    selectGame(next, true);
  });
});
motionButtons.forEach(button => button.addEventListener('click', () => setMotion(enabled, true)));
reducedMotion.addEventListener('change', event => setMotion(event.matches, true));
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', () => { measure(); requestFrame(); }, { passive: true });
window.addEventListener('pageshow', () => { measure(); requestFrame(); });
window.addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; });
if (journey && hero) {
  const observer = new ResizeObserver(() => { measure(); requestFrame(); });
  observer.observe(journey);
  observer.observe(hero);
  document.fonts.ready.then(() => { measure(); requestFrame(); });
  sharedBox?.querySelectorAll<HTMLImageElement>('img').forEach(image => { image.decode().catch(() => {}); });
  setMotion(reducedMotion.matches);
}
