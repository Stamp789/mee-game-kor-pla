import { getFavorites } from './site-ui';
import { genres } from '../lib/catalog';
import { matchesSearch, normalizeSearch } from '../lib/search';

const catalog = document.querySelector<HTMLElement>('[data-catalog]');
if (catalog) {
  const root = catalog;
  const form = root.querySelector<HTMLFormElement>('#archive-search-form')!;
  const query = root.querySelector<HTMLInputElement>('[name=q]')!;
  const source = root.querySelector<HTMLSelectElement>('[name=source]')!;
  const sort = root.querySelector<HTMLSelectElement>('[name=sort]')!;
  const savedButton = root.querySelector<HTMLButtonElement>('.saved-filter')!;
  const cards = [...root.querySelectorAll<HTMLElement>('.archive-card')];
  const grid = root.querySelector<HTMLElement>('.archive-results')!;
  const genreButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-genre]')];
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>('.archive-view button')];
  const activeFilters = root.querySelector<HTMLElement>('.active-filters')!;
  const resultsTitle = root.querySelector<HTMLHeadingElement>('.results-title')!;
  const pagination = root.querySelector<HTMLElement>('.archive-pagination')!;
  const pageButtons = root.querySelector<HTMLElement>('.page-buttons')!;
  const empty = root.querySelector<HTMLElement>('.catalog-empty')!;
  const pageSize = 12;
  let savedOnly = false;
  let genre = 'all';
  let page = 1;
  let view = 'grid';
  let typingTimer = 0;

  function readUrl() {
    const params = new URLSearchParams(location.search);
    query.value = params.get('q') || '';
    source.value = ['nexus', 'drive', 'mediafire'].includes(params.get('source') || '') ? params.get('source')! : 'all';
    sort.value = params.get('sort') === 'name' ? 'name' : 'latest';
    savedOnly = params.get('saved') === '1';
    genre = genres.some(item => item.id === params.get('genre')) ? params.get('genre')! : 'all';
    const requestedPage = Number(params.get('page') || 1);
    page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    view = params.get('view') === 'list' ? 'list' : 'grid';
  }

  function writeUrl() {
    const params = new URLSearchParams();
    if (query.value.trim()) params.set('q', query.value.trim());
    if (source.value !== 'all') params.set('source', source.value);
    if (genre !== 'all') params.set('genre', genre);
    if (sort.value !== 'latest') params.set('sort', sort.value);
    if (savedOnly) params.set('saved', '1');
    if (view !== 'grid') params.set('view', view);
    if (page > 1) params.set('page', String(page));
    const next = `${location.pathname}${params.size ? `?${params}` : ''}`;
    if (`${location.pathname}${location.search}` !== next) history.pushState(null, '', next);
  }

  function changeFilter(action: () => void) {
    clearTimeout(typingTimer);
    action();
    page = 1;
    render(true);
  }

  function addChip(label: string, remove: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.setAttribute('aria-label', `ล้างตัวกรอง ${label}`);
    const text = document.createElement('span');
    text.textContent = label;
    const close = document.createElement('span');
    close.textContent = '×';
    close.setAttribute('aria-hidden', 'true');
    button.append(text, close);
    button.addEventListener('click', () => changeFilter(remove));
    activeFilters.append(button);
  }

  function pageButton(label: string, target: number, disabled = false, selected = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.disabled = disabled;
    button.dataset.page = String(target);
    button.setAttribute('aria-label', /^\d+$/.test(label) ? `หน้า ${target}` : label);
    if (selected) button.setAttribute('aria-current', 'page');
    pageButtons.append(button);
  }

  function render(updateUrl = false) {
    const text = normalizeSearch(query.value);
    const favorites = getFavorites();
    const baseMatches = cards.filter(card =>
      matchesSearch(card.dataset.search!, text) &&
      (source.value === 'all' || card.dataset.source === source.value) &&
      (!savedOnly || favorites.includes(card.dataset.id!)),
    );
    const matchesGenre = (card: HTMLElement, value: string) => value === 'all' || card.dataset.genres!.split(' ').includes(value);
    const matches = baseMatches.filter(card => matchesGenre(card, genre)).sort((a, b) =>
      sort.value === 'name'
        ? a.dataset.title!.localeCompare(b.dataset.title!, 'en')
        : b.dataset.date!.localeCompare(a.dataset.date!) || a.dataset.title!.localeCompare(b.dataset.title!, 'en'),
    );
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pageCount);
    const start = (page - 1) * pageSize;
    const visibleCards = new Set(matches.slice(start, start + pageSize));
    // Move only when order changes, preserving focused favorite buttons during updates.
    const ordered = [...matches, ...cards.filter(card => !matches.includes(card))];
    ordered.forEach((card, index) => {
      card.hidden = !visibleCards.has(card);
      if (grid.children[index] !== card) grid.insertBefore(card, grid.children[index] || null);
    });
    grid.dataset.view = view;
    grid.hidden = matches.length === 0;
    empty.hidden = matches.length > 0;
    root.querySelector('.result-count')!.textContent = `${matches.length} เกม${savedOnly ? 'ที่บันทึกไว้' : 'ในคลัง'}`;
    const chosenGenre = genres.find(item => item.id === genre)!;
    resultsTitle.textContent = text ? 'ผลการค้นหา' : savedOnly ? 'เกมที่บันทึกไว้' : genre === 'all' ? 'ม็อดทั้งหมด' : chosenGenre.label;
    root.querySelector('.empty-message')!.textContent = savedOnly
      ? 'ยังไม่มีเกมที่บันทึกไว้ตรงกับตัวกรองนี้ กดหัวใจบนการ์ดเพื่อเก็บเกมที่สนใจ'
      : 'ลองใช้ชื่อเกมภาษาอังกฤษ เปลี่ยนแนวเกม หรือล้างตัวกรอง';
    savedButton.setAttribute('aria-pressed', String(savedOnly));
    root.querySelector('.saved-count')!.textContent = String(cards.filter(card => favorites.includes(card.dataset.id!)).length);
    genreButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.genre === genre));
      button.querySelector('.genre-count')!.textContent = String(baseMatches.filter(card => matchesGenre(card, button.dataset.genre!)).length);
    });
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    root.querySelector<HTMLElement>('.query-clear')!.hidden = !query.value;
    root.querySelector<HTMLElement>('.archive-sidebar-heading .reset-filter')!.hidden = !(text || source.value !== 'all' || genre !== 'all' || savedOnly || sort.value !== 'latest');

    activeFilters.replaceChildren();
    if (text) addChip(`ค้นหา: ${query.value.trim()}`, () => { query.value = ''; });
    if (genre !== 'all') addChip(chosenGenre.label, () => { genre = 'all'; });
    if (source.value !== 'all') addChip(source.options[source.selectedIndex].text, () => { source.value = 'all'; });
    if (savedOnly) addChip('เกมที่บันทึกไว้', () => { savedOnly = false; });
    activeFilters.hidden = activeFilters.childElementCount === 0;

    pagination.hidden = matches.length === 0;
    root.querySelector('.pagination-summary')!.textContent = `แสดง ${matches.length ? start + 1 : 0}–${Math.min(start + pageSize, matches.length)} จาก ${matches.length} เกม`;
    pageButtons.replaceChildren();
    if (pageCount > 1) {
      pageButton('← ก่อนหน้า', page - 1, page === 1);
      for (let number = 1; number <= pageCount; number++) pageButton(String(number), number, false, number === page);
      pageButton('ถัดไป →', page + 1, page === pageCount);
    }
    if (updateUrl) writeUrl();
    document.dispatchEvent(new CustomEvent('catalog-rendered'));
  }

  form.addEventListener('submit', event => { event.preventDefault(); changeFilter(() => {}); });
  query.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => { page = 1; render(true); }, 220);
  });
  root.querySelector('.query-clear')!.addEventListener('click', () => { changeFilter(() => { query.value = ''; }); query.focus(); });
  [source, sort].forEach(select => select.addEventListener('change', () => changeFilter(() => {})));
  genreButtons.forEach(button => button.addEventListener('click', () => changeFilter(() => { genre = button.dataset.genre!; })));
  savedButton.addEventListener('click', () => changeFilter(() => { savedOnly = !savedOnly; }));
  viewButtons.forEach(button => button.addEventListener('click', () => { clearTimeout(typingTimer); view = button.dataset.view!; render(true); }));
  root.querySelectorAll('.reset-filter').forEach(button => button.addEventListener('click', () => changeFilter(() => {
    query.value = ''; source.value = 'all'; sort.value = 'latest'; genre = 'all'; savedOnly = false;
  })));
  pageButtons.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-page]');
    if (!button || button.disabled) return;
    clearTimeout(typingTimer);
    page = Number(button.dataset.page);
    render(true);
    resultsTitle.focus({ preventScroll: true });
    root.querySelector('#archive-results')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  window.addEventListener('popstate', () => { clearTimeout(typingTimer); readUrl(); render(); });
  document.addEventListener('favorites-change', () => render());
  readUrl();
  render();
}
