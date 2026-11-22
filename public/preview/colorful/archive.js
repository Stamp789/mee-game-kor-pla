import {makeWalkingScore} from './score.js';
// The preview lives under <site base>/preview/colorful/. Site-relative paths in the markup and data
// ("/mods/", "/assets/...") are mapped onto that folder; covers and the logo come from the main site's assets.
const ROOT = new URL('./', import.meta.url);
const SITE = new URL(document.documentElement.dataset.siteBase || '/', location.origin);
const localize = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return value;
  if (/^\/assets\/(cover-|brand\.webp|portal-)/.test(value)) return new URL(value.slice(1), SITE).href;
  return new URL(value.slice(1), ROOT).href;
};
const {mods, chapters} = await fetch(new URL('data.json', ROOT)).then(response => response.json());
const path = ('/' + location.pathname.slice(ROOT.pathname.length)).replace(/\/+$/, '');
const active = path === '/farewell' ? 'farewell' : path.startsWith('/mods') ? 'mods' : 'home';
const detail = path.startsWith('/mods/') ? mods.find(mod => mod.id === path.split('/').at(-1)) : null;
const $ = (selector) => document.querySelector(selector);
const safe = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const url = (value) => {
  if (!value) return '';
  try { const dest = new URL(localize(value), location.origin); return ['https:', 'http:'].includes(dest.protocol) ? safe(dest.href) : ''; }
  catch { return ''; }
};
// Rewrite literal site-relative links/images inside rendered markup.
const relink = (root) => root.querySelectorAll('[href^="/"],[src^="/"]').forEach(el => {
  for (const attr of ['href', 'src']) {
    const value = el.getAttribute(attr);
    if (value && value.startsWith('/') && !value.startsWith('//')) el.setAttribute(attr, localize(value));
  }
});
const categories = {action:'แอ็กชัน', visual:'เน้นเนื้อเรื่อง', strategy:'วางแผน', sim:'จำลองสถานการณ์', rpg:'RPG', adventure:'ผจญภัย', indie:'อินดี้', other:'อื่น ๆ'};
const category = (mod) => categories[mod.category] || mod.category;
// platform is usually a string, but a few entries list several platforms.
const platform = (mod) => ([mod.platform].flat().filter(Boolean).join(' / ') || 'pc').toUpperCase();
const cover = (mod) => '/assets/cover-' + mod.id + '.webp';
const modLink = (mod) => `/mods/${mod.id}/`;
const image = (src, alt, eager = false, attrs = '') => `<img src="${url(src)}" alt="${safe(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${attrs}>`;
const logo = (className) => `<img class="${className}" src="/assets/brand.webp" alt="" width="160" height="160" decoding="async">`;
const label = (text) => `<p class="eyebrow">${text}</p>`;
const icon = (key) => {
  const paths = {search:'<circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 4 4"/>', note:'<path d="M9 17V5l9-2v12"/><ellipse cx="6" cy="17" rx="3" ry="2"/><ellipse cx="15" cy="15" rx="3" ry="2"/>', play:'<path d="m9 5 10 7-10 7z"/>'};
  return `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${paths[key]}</svg>`;
};
function navLink(id,href,text) {
  return `<a href="${href}" ${active === id ? 'aria-current="page"' : ''}>${text}</a>`;
}
function header() {
  return `<header class="top"><div class="wrap top-inner">
    <a href="/" class="brand" aria-label="มีเกมก็แปล หน้าแรก">${logo("brand-logo")}<span><b>มีเกมก็แปล</b><small>คลังม็อดภาษาไทย</small></span></a>
    <nav aria-label="เมนูหลัก">${navLink('home','/','หน้าแรก')}${navLink('mods','/mods/','คลังม็อด')}${navLink('farewell','/farewell/','บันทึกส่งท้าย')}</nav>
    <a class="search-link" href="/mods/#search" aria-label="ค้นหาเกม">${icon('search')}<span>ค้นหาเกม</span></a>
  </div></header>`;
}
function footer() {
  return `<footer class="foot"><div class="wrap foot-inner"><a class="brand" href="/">${logo("brand-logo")}<b>มีเกมก็แปล</b></a><p>ม็อดภาษาไทยโดย Stamp Nattakit</p><nav aria-label="เมนูท้ายหน้า"><a href="/mods/">คลังม็อด</a><a href="/farewell/">บันทึกส่งท้าย</a></nav></div></footer>`;
}
function card(mod) {
  return `<article class="game-card"><a href="${modLink(mod)}">
    <div class="card-image">${image(cover(mod),'')}<span class="card-status ${mod.statusText === 'เร็ว ๆ นี้' ? 'pending' : ''}">${safe(mod.statusText)}</span></div>
    <p class="card-type">${safe(category(mod))} <span>·</span> ${safe(platform(mod))}</p>
    <h3>${safe(mod.title)}</h3><p class="thai-title">${safe(mod.thaiTitle)}</p>
  </a></article>`;
}
function home() {
  const featured = mods.find(mod => mod.id === 'i-am-setsuna');
  const scenes = [
    {title: featured.title, image:'/assets/i-am-setsuna-0.jpg', alt:'ตัวละครยืนริมหน้าผาหิมะใน I AM SETSUNA', href:modLink(featured), credit:'ภาพในเกม · Square Enix'},
    {title:'Dishonored 2', image:'/assets/dishonored-2-0.jpg', alt:'ภาพจาก Dishonored 2', href:'/mods/dishonored-2/', credit:'ภาพในเกม · Arkane Studios'},
    {title:'Atelier Sophie 2', image:chapters.at(-1).image, alt:'ภาพจาก Atelier Sophie 2', href:'/farewell/#chapter-51', credit:'ภาพในเกม · KOEI TECMO'},
  ];
  const picks = [featured, ...['dishonored-2','tales-of-berseria','annihilated'].map(id=>mods.find(mod=>mod.id===id))];
  return `<main id="main">
    <div class="hero-shell"><section class="wrap home-hero">
      <div class="hero-copy">${label('ถึงคนที่เคยเล่นด้วยกัน')}
        <h1>บางเรื่อง<br>เราอยากอ่าน<br><em>เป็นภาษาไทย</em></h1>
        <p>จากบทสนทนาบรรทัดแรกถึงฉากที่ยังจำได้<br class="desk"> รวมม็อดภาษาไทยที่เราอยากให้คุณได้เล่น</p>
        <div class="actions"><a class="button primary" href="/mods/">เปิดคลังม็อด</a><a class="text-link" href="/farewell/">อ่านบันทึกส่งท้าย</a></div>
      </div>
      <figure class="hero-figure">
        <span class="hero-spark spark-a" aria-hidden="true"></span><span class="hero-spark spark-b" aria-hidden="true"></span>
        <div class="hero-scenery">
          <a class="hero-frame" href="${scenes[0].href}" aria-label="เปิดหน้าม็อด ${scenes[0].title}">
            <div class="hero-window">${image(scenes[0].image,scenes[0].alt,true)}</div>
          </a>
          ${logo('hero-brand-sticker')}
        </div>
        <figcaption><b aria-live="polite">${scenes[0].title}</b><span>${scenes[0].credit}</span></figcaption>
        <div class="scene-switcher" aria-label="เลือกภาพปกเกม">
          ${scenes.map((scene,index) => `<button type="button" aria-label="${safe(scene.title)}" aria-pressed="${index === 0}" data-scene="${index}" data-image="${url(scene.image)}" data-href="${url(scene.href)}" data-alt="${safe(scene.alt)}" data-credit="${safe(scene.credit)}">${image(scene.image,'')}</button>`).join('')}
        </div>
      </figure>
    </section></div>
    <section class="wrap home-picks">
      <div class="section-head"><div>${label('จากคลังม็อด')}<h2>กลับไปเล่นอีกครั้ง</h2></div><a class="text-link" href="/mods/">ดูทั้ง ${mods.length} เกม</a></div>
      <div class="game-grid">${picks.map(card).join('')}</div>
    </section>
    <section class="home-letter"><div class="wrap letter-inner">
      <figure>${image(chapters.at(-1).image,'ภาพจาก Atelier Sophie 2')}<figcaption>Atelier Sophie 2 · ภาพจาก Steam</figcaption></figure>
      <div>${label('เกมที่ 45–51')}<h2>ก่อนจะถึง<br>บรรทัดสุดท้าย</h2><p>ภาพจากเจ็ดเกม และจดหมายที่เก็บไว้ในโปรเจกต์ส่งท้ายของเรา</p><a class="button outlined" href="/farewell/">เปิดบันทึกส่งท้าย</a></div>
    </div></section>
  </main>`;
}
function catalog() {
  return `<main id="main" class="wrap catalog">
    <header class="page-head"><div>${label('มีเกมก็แปล')}<h1>คลังม็อด<span>.</span></h1></div><p>ค้นหาเกมด้วยชื่อไทยหรืออังกฤษ<br>ดูเวอร์ชัน วิธีติดตั้ง และลิงก์ดาวน์โหลด</p></header>
    <form class="filter-bar" role="search"><label class="search-field" for="search">${icon('search')}<input type="search" id="search" name="q" autocomplete="off" placeholder="ค้นหาชื่อเกม เช่น Dishonored" aria-label="ค้นหาชื่อเกม"></label>
    <label>สถานะ <select name="status" aria-label="กรองสถานะ"><option value="">ทุกสถานะ</option><option>พร้อมโหลด</option><option>เร็ว ๆ นี้</option></select></label>
    <label>เรียงตาม <select name="sort" aria-label="เรียงเกม"><option value="recent">อัปเดตล่าสุด</option><option value="name">ชื่อเกม A–Z</option></select></label></form>
    <div class="result-count" aria-live="polite"></div><div class="game-grid" id="results"></div>
  </main>`;
}
function setupCatalog() {
  const form = $('.filter-bar');
  const params = new URLSearchParams(location.search);
  form.q.value = params.get('q') || '';
  form.status.value = params.get('status') || '';
  form.sort.value = params.get('sort') === 'name' ? 'name' : 'recent';
  function update() {
    const query = form.q.value.trim().toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    const results = mods.filter(mod => {
      const searchable = [mod.title, mod.thaiTitle, mod.code, ...mod.tags].join(' ').toLowerCase();
      return (!form.status.value || form.status.value === mod.statusText) && words.every(word => searchable.includes(word));
    });
    if (form.sort.value === 'name') results.sort((a,b) => a.title.localeCompare(b.title));
    $('.result-count').textContent = `พบ ${results.length} เกม`;
    $('#results').innerHTML = results.length ? results.map(card).join('') : '<p class="empty">ไม่พบเกมที่ตรงกับการค้นหา</p>';
    relink($('#results'));
    const next = new URL(location.href);
    next.search = '';
    if (form.q.value.trim()) next.searchParams.set('q', form.q.value.trim());
    if (form.status.value) next.searchParams.set('status', form.status.value);
    if (form.sort.value === 'name') next.searchParams.set('sort','name');
    history.replaceState(null,'',next);
  }
  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  form.addEventListener('input', update);
  update();
  if (location.hash === '#search') form.q.focus();
}
const providers = {nexus:'Nexus Mods',drive:'Google Drive',mediafire:'MediaFire'};
function downloads(mod) {
  if (mod.statusText === 'เร็ว ๆ นี้') return [];
  return Object.keys(providers).filter(key => {
    return mod[key] && !(mod.id === 'annihilated' && key === 'drive' && Date.now() >= new Date('2026-11-16T12:00:00+07:00').getTime());
  }).sort((a,b) => Number(b === mod.source) - Number(a === mod.source)).map(key => {
    const dest = new URL(mod[key]);
    if (key === 'nexus' && ['www.nexusmods.com','nexusmods.com'].includes(dest.hostname)) dest.searchParams.set('tab','files');
    return {key, name:providers[key], href:dest.href};
  });
}
function downloadBox(mod) {
  const links = downloads(mod);
  return `<aside class="download-box"><p class="eyebrow">ไฟล์ม็อดภาษาไทย</p><h2>${links.length ? 'ดาวน์โหลดม็อด' : 'ยังไม่มีไฟล์ให้โหลด'}</h2>
    <dl><div><dt>เวอร์ชัน</dt><dd>${safe(mod.version || '–')}</dd></div><div><dt>รองรับ</dt><dd>${safe(mod.gameBuild || mod.platform)}</dd></div><div><dt>ขนาด</dt><dd>${safe(mod.size || 'ดูที่หน้าดาวน์โหลด')}</dd></div></dl>
    ${links.map(({name,href},index)=>`<a class="button ${index ? 'outlined' : 'primary'}" href="${url(href)}" target="_blank" rel="noopener noreferrer">โหลดจาก ${name}</a>`).join('')}
    ${links.some(link=>link.key==='nexus') ? '<p class="box-note">เปิดแท็บ Files บน Nexus Mods และเข้าสู่ระบบก่อนดาวน์โหลด</p>' : ''}
    ${mod.install?.length ? '<a class="text-link" href="#install">วิธีติดตั้ง</a>' : ''}</aside>`;
}
function game(mod) {
  if (!mod) return `<main id="main" class="wrap page-head"><h1>ไม่พบเกมนี้</h1><a class="text-link" href="/mods/">กลับคลังม็อด</a></main>`;
  const photos = mod.gallery || [];
  const items = (list) => list.map(item => `<li>${safe(item)}</li>`).join('');
  return `<main id="main" class="wrap detail">
    <div class="breadcrumb"><a href="/mods/">คลังม็อด</a><span>/</span><span>${safe(mod.title)}</span></div>
    <div class="detail-layout">
      <article><header class="detail-head">${label(safe(category(mod))+' · '+safe(platform(mod)))}<h1>${safe(mod.title)}</h1><p>${safe(mod.thaiTitle)}</p></header>
      <figure class="detail-photo">${image(photos[0] || cover(mod), photos.length ? 'ภาพจาก '+mod.title : 'ปก '+mod.title,true,'id="photo"')}<figcaption>${photos.length ? 'ภาพในเกมจากหน้าร้าน Steam' : 'ภาพปกเกม'}</figcaption></figure>
      ${photos.length > 1 ? `<div class="thumbs" aria-label="เลือกภาพในเกม">${photos.map((photo,index)=>`<button type="button" data-photo="${url(photo)}" aria-label="ภาพที่ ${index+1}" aria-pressed="${index===0}">${image(photo,'')}</button>`).join('')}</div>` : ''}
      <section class="detail-section"><h2>เกี่ยวกับม็อด</h2><p>${safe(mod.description)}</p><p class="credit">ผู้แปล · ${safe(mod.translator)}</p></section>
      ${mod.install?.length ? `<section class="detail-section" id="install"><h2>วิธีติดตั้ง</h2><ol>${items(mod.install)}</ol></section>` : ''}
      ${mod.changelog?.length ? `<section class="detail-section"><h2>บันทึกอัปเดต</h2><ul>${items(mod.changelog)}</ul></section>` : ''}
      </article><div>${downloadBox(mod)}</div>
    </div></main>`;
}
function farewell() {
  const first = chapters[0];
  const last = chapters.at(-1);
  return `<main id="main" class="farewell">
    <div class="progress" aria-hidden="true"><span></span></div>
    <section class="wrap goodbye-hero">
      <div>${label('บันทึกส่งท้าย · เกมที่ 45–51')}
        <h1>ก่อนจะถึง<br><em>บรรทัดสุดท้าย</em></h1>
        <p>ภาพจากเจ็ดเกมกับจดหมายเดิมของโปรเจกต์<br class="desk"> เก็บไว้ให้อ่านในวันที่คิดถึงกัน</p>
        <a href="#chapter-${first.disc}" class="text-link">เริ่มอ่านบันทึก</a>
      </div>
      <figure class="album-cover">${image(last.image,'ภาพจาก Atelier Sophie 2',true)}<figcaption>Atelier Sophie 2 <span>เกมที่ 51</span></figcaption></figure>
    </section>
    <div class="wrap chapters">
      ${chapters.map(chapter=>`<article id="chapter-${chapter.disc}" class="chapter">
        <figure>${image(chapter.image,'ภาพประกอบ '+chapter.title)}<figcaption><span>${safe(chapter.caption)}</span><a href="${url(chapter.store)}" target="_blank" rel="noopener noreferrer">ดูที่มา</a></figcaption></figure>
        <div class="chapter-copy">${label('เกมที่ '+chapter.disc)}
          <h2>${safe(chapter.title)}</h2>
          <blockquote>${safe(chapter.note)}</blockquote><p class="chapter-credit">จากจดหมายในหน้าส่งท้ายเดิม</p>
        </div>
      </article>`).join('')}
    </div>
    <section class="ending" id="thanks"><div class="wrap">
      ${logo("brand-logo")}
      <h2>ขอบคุณที่<br>เล่นด้วยกันมา</h2>
      <p>ขอบคุณที่รออ่านซับไทย และให้ประโยคที่เราแปล<br class="desk"> ได้มีที่อยู่ในเกมที่คุณรัก</p>
      <p class="sign">มีเกมก็แปล</p><a href="/mods/" class="button outlined">กลับไปที่คลังม็อด</a>
    </div></section>
    <button type="button" class="audio-button" aria-pressed="false">${icon('note')}<span>เปิดเพลง</span></button>
  </main>`;
}
function setupFarewell() {
  const control = $('.audio-button');
  const progress = $('.progress span');
  let score, enabled = false, requested = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const portion = max > 0 ? Math.min(1,scrollY/max) : 0;
    progress.style.transform = `scaleX(${portion})`;
    if (enabled && score) score.fade(portion);
  }
  async function start() {
    try {
      score ||= makeWalkingScore();
      if (!(await score.start()) || !requested) return;
      enabled = true;
      control.setAttribute('aria-pressed','true');
      control.querySelector('span').textContent = 'ปิดเพลง';
      updateScroll();
    } catch {}
  }
  control.addEventListener('click', () => {
    if (enabled) {
      enabled = requested = false;
      score.stop();
      control.setAttribute('aria-pressed','false');
      control.querySelector('span').textContent = 'เปิดเพลง';
    } else {
      requested = true;
      start();
    }
  });
  let pendingFrame = 0;
  addEventListener('scroll', () => {
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      updateScroll();
    });
  }, {passive:true});
  addEventListener('resize', updateScroll, {passive:true});
  updateScroll();
  // Attempt autoplay after navigation only if the browser has already granted activation.
  if (navigator.userActivation?.hasBeenActive) {
    requested = true;
    start();
  }
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function setupHomeScenes() {
  const figure = $('.hero-figure');
  const frame = figure.querySelector('.hero-frame');
  const photo = frame.querySelector('img');
  const buttons = [...figure.querySelectorAll('[data-scene]')];
  const caption = figure.querySelector('figcaption');
  let selection = 0;
  let effect;
  for (const button of buttons) button.addEventListener('click', async () => {
    const current = ++selection;
    const next = new Image();
    next.src = button.dataset.image;
    try { await next.decode(); } catch { return; }
    if (current !== selection) return;
    photo.src = next.src;
    photo.alt = button.dataset.alt;
    frame.href = button.dataset.href;
    frame.setAttribute('aria-label', button.getAttribute('aria-label'));
    caption.querySelector('b').textContent = button.getAttribute('aria-label');
    caption.querySelector('span').textContent = button.dataset.credit;
    figure.dataset.scene = button.dataset.scene;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    if (!reducedMotion.matches) {
      effect?.cancel();
      effect = photo.animate([{opacity:0.4,transform:'scale(1.035)'},{opacity:1,transform:'none'}],{duration:410,easing:'ease-out'});
    }
  });
  if (matchMedia('(pointer:fine)').matches) {
    let bounds;
    let frameId = 0;
    figure.addEventListener('pointerenter', () => { bounds = figure.getBoundingClientRect(); });
    figure.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !bounds || frameId) return;
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        figure.style.setProperty('--tilt-x', (y * -7) + 'deg');
        figure.style.setProperty('--tilt-y', (x * 9) + 'deg');
      });
    });
    figure.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
      figure.style.removeProperty('--tilt-x');
      figure.style.removeProperty('--tilt-y');
    });
  }
}
function setupReveals() {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const {target,isIntersecting} of entries) {
      if (!isIntersecting) continue;
      if (!reducedMotion.matches) target.classList.add('revealed');
      observer.unobserve(target);
    }
  },{threshold:.14});
  document.querySelectorAll('.home-picks .game-card, .home-letter figure, .detail-photo, .chapter figure, .chapter-copy, .ending .brand-logo')
    .forEach(element => observer.observe(element));
}
function setupGallery() {
  document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{
    $('#photo').src = button.dataset.photo;
    document.querySelectorAll('[data-photo]').forEach(thumb=>thumb.setAttribute('aria-pressed',String(thumb===button)));
  }));
}
document.body.className = active === 'farewell' ? 'dark' : '';
const main = active === 'home' ? home() : active === 'farewell' ? farewell() : path === '/mods' ? catalog() : game(detail);
$('#site').innerHTML = header() + main + footer();
relink($('#site'));
document.title = (detail?.title || ({home:'คลังม็อดภาษาไทย',mods:'คลังม็อด',farewell:'ก่อนจะถึงบรรทัดสุดท้าย'}[active])) + ' | มีเกมก็แปล';
if (path === '/mods') setupCatalog();
if (active === 'home') setupHomeScenes();
setupReveals();
if (active === 'farewell') setupFarewell();
if (detail) setupGallery();
if (location.hash && location.hash !== '#search') document.getElementById(location.hash.slice(1))?.scrollIntoView();
