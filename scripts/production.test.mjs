import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { matchesSearch, searchTerms } from '../src/lib/search.ts';
import { renderPixelRatio } from '../src/scenes/hero/render-budget.ts';
import { downloadUrl } from '../src/lib/downloads.ts';

const records = await Promise.all((await readdir(new URL('../src/content/mods/', import.meta.url)))
  .filter(file => file.endsWith('.json')).map(async file => JSON.parse(await readFile(new URL(`../src/content/mods/${file}`, import.meta.url), 'utf8'))));

test('all games are discoverable by English / Thai names with case and whitespace variations', () => {
  for (const mod of records) {
    const text = searchTerms(mod);
    assert.ok(matchesSearch(text, `  ${mod.title.toUpperCase().replaceAll(' ', '   ')}  `), mod.id);
    assert.ok(matchesSearch(text, mod.thaiTitle.normalize('NFD')), mod.id);
    assert.ok(matchesSearch(text, ''), 'clearing a search restores the catalog');
  }
});
test('multiword / platform searches use the same matcher in both search surfaces', () => {
  const berseria = records.find(mod => mod.id === 'tales-of-berseria');
  assert.ok(matchesSearch(searchTerms(berseria), 'BERSERIA tales'));
  const dressmaker = records.find(mod => mod.id === 'dressmaker');
  assert.ok(matchesSearch(searchTerms(dressmaker), 'dressmaker macOS'));
  assert.ok(matchesSearch(searchTerms(dressmaker), 'dressmaker windows'));
  assert.equal(matchesSearch(searchTerms(dressmaker), 'unrelated-game-xyz'), false);
});
test('every primary download provider has a real HTTPS destination', () => {
  for (const mod of records) {
    assert.ok(mod[mod.source], `missing primary download: ${mod.id}`);
    for (const key of ['nexus', 'drive', 'mediafire']) if (mod[key]) {
      const target = new URL(mod[key]); assert.equal(target.protocol, 'https:');
      assert.ok({ nexus: ['www.nexusmods.com', 'nexusmods.com'], drive: ['drive.google.com'], mediafire: ['www.mediafire.com', 'mediafire.com'] }[key].includes(target.hostname), mod.id);
    }
  }
});
test('render budget bounds bloom buffers at Retina / 4K / 8K sizes without changing aspect', () => {
  for (const [width, height, dpr] of [[1440,900,2],[1920,1080,1],[2560,1440,2],[3840,2160,2],[7680,4320,2]]) {
    const ratio = renderPixelRatio(width, height, dpr);
    assert.ok(width * height * ratio * ratio <= 2_600_000 + 1);
    assert.ok(ratio > 0 && ratio <= dpr);
    assert.ok(renderPixelRatio(width, height, dpr, .65) < ratio);
  }
});
test('download buttons open Nexus Files directly and preserve Drive / MediaFire targets', () => {
  for (const mod of records) {
    const actual = downloadUrl(mod.source, mod[mod.source]);
    if (mod.source === 'nexus') {
      const original = new URL(mod.nexus), target = new URL(actual);
      assert.equal(target.origin + target.pathname, original.origin + original.pathname);
      assert.equal(target.searchParams.get('tab'), 'files');
    } else assert.equal(actual, mod[mod.source]);
  }
});
