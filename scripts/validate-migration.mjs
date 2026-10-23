import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// One-time migration audit. Normal builds allow the V2 collection to evolve independently.
const legacy = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const end = legacy.indexOf('\nconst state =');
const original = JSON.parse(vm.runInNewContext(`${legacy.slice(0, end)}; JSON.stringify(mods)`, {}, { timeout: 1000 }));
const directory = new URL('../src/content/mods/', import.meta.url);
const files = (await readdir(directory)).filter(file => file.endsWith('.json'));
assert.equal(files.length, original.length);
for (const file of files) {
  const record = JSON.parse(await readFile(new URL(file, directory), 'utf8'));
  assert.deepEqual(record, original.find(mod => mod.id === record.id), `Migration mismatch: ${record.id}`);
}
console.log(`Migration audit passed: all ${original.length} original records match, including every field and URL.`);
