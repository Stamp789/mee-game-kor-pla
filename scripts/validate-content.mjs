import { readFile, readdir, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
const files = await readdir(new URL('../src/content/mods/', import.meta.url));
const records = await Promise.all(files.filter(f => f.endsWith('.json')).map(async file => {
  const record = JSON.parse(await readFile(new URL(`../src/content/mods/${file}`, import.meta.url), 'utf8'));
  assert.equal(`${record.id}.json`, file);
  assert.match(record.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(record.title && record.translator && record.version, `Required metadata: ${record.id}`);
  assert.ok([record.nexus, record.drive, record.mediafire].some(Boolean), `Download URL missing: ${record.id}`);
  for (const key of ['nexus', 'drive', 'mediafire', 'post', 'store']) {
    if (record[key]) assert.equal(new URL(record[key]).protocol, 'https:');
  }
  for (const link of record.purchaseLinks || []) assert.equal(new URL(link.href).protocol, 'https:');
  await access(new URL(`../public/${record.cover.replace(/\.(png|jpe?g)$/i, '.webp')}`, import.meta.url));
  return record;
}));
assert.ok(records.length > 0);
assert.equal(new Set(records.map(mod => mod.id)).size, records.length);
console.log(`Validated ${records.length} records, unique IDs, assets and HTTPS destinations.`);
