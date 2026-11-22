import { matchesSearch, normalizeSearch } from '../lib/search';

export function toast(message: string) {
  const el = document.querySelector<HTMLElement>('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('visible'), 2800);
}
let toastTimer = 0;
const favoriteKey = 'modthai-favorites';
export function readFavorites(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(favoriteKey) || '[]');
    return Array.isArray(data) ? [...new Set(data.filter((item): item is string => typeof item === 'string'))] : [];
  } catch { return []; }
}
let memoryFavorites = readFavorites();
export function getFavorites() { return memoryFavorites; }
function updateFavorites() {
  document.querySelectorAll<HTMLButtonElement>('[data-favorite]').forEach(button => {
    const saved = memoryFavorites.includes(button.dataset.favorite!);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'นำออกจากรายการบันทึก' : 'บันทึก'} ${button.closest('article')?.querySelector('h3')?.textContent || document.querySelector('h1')?.textContent?.replace(/\.$/, '') || 'เกมนี้'}`);
  });
}
updateFavorites();
document.querySelectorAll<HTMLButtonElement>('[data-favorite]').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.favorite!;
    const saved = memoryFavorites.includes(id);
    memoryFavorites = saved ? memoryFavorites.filter(item => item !== id) : [...memoryFavorites, id];
    let persisted = true;
    try { localStorage.setItem(favoriteKey, JSON.stringify(memoryFavorites)); } catch { persisted = false; }
    updateFavorites();
    document.dispatchEvent(new CustomEvent('favorites-change'));
    toast(persisted ? saved ? 'นำออกจากรายการบันทึกแล้ว' : 'บันทึกเกมไว้แล้ว' : 'บันทึกชั่วคราวในหน้านี้ — เบราว์เซอร์ปิดการเก็บข้อมูล');
  });
});
window.addEventListener('storage', event => {
  if (event.key === favoriteKey) {
    memoryFavorites = readFavorites(); updateFavorites(); document.dispatchEvent(new CustomEvent('favorites-change'));
  }
});
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    memoryFavorites = readFavorites(); updateFavorites();
    document.dispatchEvent(new CustomEvent('favorites-change'));
  }
});

const searchDialog = document.querySelector<HTMLDialogElement>('#search-dialog');
const searchInput = document.querySelector<HTMLInputElement>('#global-search');
function openSearch() {
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
  searchDialog?.showModal();
  searchInput?.focus();
}
document.querySelectorAll('.search-open').forEach(button => button.addEventListener('click', openSearch));
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
});
searchInput?.addEventListener('input', () => {
  const query = normalizeSearch(searchInput.value);
  const results = [...document.querySelectorAll<HTMLAnchorElement>('.search-result')];
  const matches = results.filter(item => matchesSearch(item.dataset.search || '', query));
  results.forEach(item => { item.hidden = !matches.slice(0, query ? 10 : 6).includes(item); });
  const feedback = document.querySelector('.search-feedback');
  if (feedback) feedback.textContent = query ? `พบ ${matches.length} เกม${matches.length > 10 ? ' · แสดง 10 เกมแรก' : ''}` : 'เกมที่คุณอาจสนใจ';
  const empty = document.querySelector<HTMLElement>('.search-empty');
  if (empty) empty.hidden = matches.length > 0;
});
searchDialog?.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopPropagation(); searchDialog.close(); return;
  }
  const visible = [...searchDialog.querySelectorAll<HTMLAnchorElement>('.search-result:not([hidden])')];
  const index = visible.indexOf(document.activeElement as HTMLAnchorElement);
  if (event.key === 'ArrowDown') {
    event.preventDefault(); visible[Math.min(index + 1, visible.length - 1)]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault(); if (index <= 0) searchInput?.focus(); else visible[index - 1]?.focus();
  } else if (event.key === 'Enter' && document.activeElement === searchInput && searchInput?.value.trim()) {
    event.preventDefault(); visible[0]?.click();
  }
});
for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog')) {
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.querySelectorAll('a').forEach(link => link.addEventListener('click', () => dialog.close()));
}
document.querySelector('.menu-open')?.addEventListener('click', () => document.querySelector<HTMLDialogElement>('#mobile-menu')?.showModal());
document.querySelectorAll('[data-support-open], #support-open').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
  document.querySelector<HTMLDialogElement>('#support-dialog')?.showModal();
}));
document.querySelector('.share-button')?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href.split('#')[0]); toast('คัดลอกลิงก์หน้านี้แล้ว'); }
  catch { toast('คัดลอกลิงก์หน้านี้ได้จากแถบที่อยู่ของเบราว์เซอร์'); }
});

// Keep published links useful, including GitHub project-site base paths.
const requestedMod = new URLSearchParams(location.search).get('mod');
const knownLink = [...document.querySelectorAll<HTMLAnchorElement>('.search-result')].find(link => new URL(link.href).pathname.endsWith(`/mods/${requestedMod}/`));
if (requestedMod && knownLink && location.pathname !== new URL(knownLink.href).pathname) location.replace(knownLink.href);
const legacyAnchors: Record<string, string> = { '#catalog': 'mods/', '#stores': 'mods/', '#community': '#about' };
if (!requestedMod && legacyAnchors[location.hash]) {
  location.replace(`${document.body.dataset.base || '/'}${legacyAnchors[location.hash]}`);
}

document.querySelectorAll<HTMLElement>('[data-expires-at]').forEach(el => {
  if (Date.now() >= Date.parse(el.dataset.expiresAt!)) el.remove();
});

// Scheduled unlock at a specific timestamp (e.g., Ys VIII at 2026-11-23T12:00:00+07:00)
function updateScheduledUnlocks() {
  const now = Date.now();
  document.querySelectorAll<HTMLAnchorElement>('[data-unlock-at]').forEach(link => {
    const unlockMs = Date.parse(link.dataset.unlockAt!);
    if (now >= unlockMs) {
      if (link.dataset.lockedHref) {
        link.href = link.dataset.lockedHref;
        delete link.dataset.lockedHref;
      }
      link.hidden = false;
    } else {
      if (!link.dataset.lockedHref && link.getAttribute('href')) {
        link.dataset.lockedHref = link.getAttribute('href')!;
        link.removeAttribute('href');
      }
      link.hidden = true;
    }
  });
  document.querySelectorAll<HTMLElement>('[data-unlock-placeholder]').forEach(el => {
    const unlockMs = Date.parse(el.dataset.unlockPlaceholder!);
    const diff = unlockMs - now;
    if (diff <= 0) {
      el.remove();
    } else {
      const totalSec = Math.ceil(diff / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      el.textContent = `⏳ เปิดให้โหลด 23/11/69 เวลา 12:00 น. (อีก ${hrs} ชม. ${mins} นาที ${secs} วินาที)`;
    }
  });
  document.querySelectorAll<HTMLElement>('[data-unlock-version]').forEach(el => {
    if (now >= Date.parse(el.dataset.unlockVersion!)) el.textContent = 'v1.0';
  });
  document.querySelectorAll<HTMLElement>('[data-unlock-footnote]').forEach(el => {
    if (now >= Date.parse(el.dataset.unlockFootnote!)) el.textContent = 'เปิดหน้าดาวน์โหลดต้นทาง เช็กไฟล์ล่าสุดก่อนลง';
  });
  document.querySelectorAll<HTMLElement>('[data-unlock-badge]').forEach(el => {
    if (now >= Date.parse(el.dataset.unlockBadge!)) {
      el.textContent = el.dataset.unlockedText || 'v1.0';
    }
  });
}
updateScheduledUnlocks();
if (document.querySelector('[data-unlock-at], [data-unlock-placeholder], [data-unlock-badge]')) {
  window.setInterval(updateScheduledUnlocks, 1000);
}
