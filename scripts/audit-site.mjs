import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { downloadUrl } from '../src/lib/downloads.ts';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const contentRoot = new URL('../src/content/mods/', import.meta.url);
const records = await Promise.all((await readdir(contentRoot)).filter(file => file.endsWith('.json')).map(async file => JSON.parse(await readFile(new URL(file, contentRoot), 'utf8'))));
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const home = await readFile(path.join(root, 'index.html'), 'utf8');
const base = home.match(/data-base="([^"]+)"/)?.[1];
assert.ok(base?.startsWith('/') && base.endsWith('/'), 'base must be explicit');
const pages = [];
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) pages.push(file);
  }
}
await walk(root);
const htmlCache = new Map();
async function html(file) { if (!htmlCache.has(file)) htmlCache.set(file, await readFile(file, 'utf8')); return htmlCache.get(file); }
let references = 0, fragments = 0, downloads = 0;
for (const file of pages) {
  const source = await html(file);
  const relative = path.relative(root, file).replaceAll(path.sep, '/').replace(/index\.html$/, '');
  const pageUrl = new URL(`${base}${relative}`, 'https://audit.invalid');
  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = decode(match[1]);
    if (!raw || /^(?:data:|mailto:|tel:)/.test(raw)) continue;
    const target = new URL(raw, pageUrl);
    if (target.origin !== pageUrl.origin) continue;
    assert.ok(target.pathname.startsWith(base), `base path escaped: ${raw} in ${relative}`);
    let resolved = path.join(root, decodeURIComponent(target.pathname.slice(base.length)));
    try { if ((await stat(resolved)).isDirectory()) resolved = path.join(resolved, 'index.html'); await stat(resolved); }
    catch { assert.fail(`Missing local target ${raw} from ${relative}`); }
    references++;
    if (target.hash && resolved.endsWith('.html')) {
      const id = decodeURIComponent(target.hash.slice(1));
      assert.ok((await html(resolved)).includes(`id="${id}"`), `Missing fragment ${raw} from ${relative}`); fragments++;
    }
  }
}
for (const mod of records) {
  const source = await html(path.join(root, 'mods', mod.id, 'index.html'));
  const downloadBlock = source.match(/<div class="download-links">([\s\S]*?)<\/div>/)?.[1] || '';
  const links = [...downloadBlock.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(match => decode(match[1]));
  for (const key of ['nexus', 'drive', 'mediafire']) if (mod[key]) { assert.ok(links.includes(downloadUrl(key, mod[key])), `Missing download ${mod.id}/${key}`); downloads++; }
  assert.ok(source.includes('id="download-panel"') && source.includes('href="#download-panel"'));
}
assert.ok((await readFile(path.join(root, 'sitemap.xml'), 'utf8')).match(/<loc>/g)?.length === records.length + 2);
const report = { base, htmlPages: pages.length, games: records.length, localReferences: references, fragments, downloadDestinations: downloads, result: 'passed' };
const reportDir = new URL('../artifacts/qa/', import.meta.url); await mkdir(reportDir, { recursive: true });
await writeFile(new URL('site-audit.json', reportDir), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
