import { readFile, mkdir, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

// Run only the legacy data declaration, never the DOM application code.
const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const end = source.indexOf('\nconst state =');
if (end < 0) throw new Error('Legacy data boundary not found');
const mods = vm.runInNewContext(`${source.slice(0, end)}; JSON.stringify(mods)`, {}, { timeout: 1000 });
const records = JSON.parse(mods);
const directory = new URL('../src/content/mods/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const record of records) {
  await writeFile(new URL(`${record.id}.json`, directory), `${JSON.stringify(record, null, 2)}\n`);
}
console.log(`Migrated ${records.length} records, preserving every original field and URL.`);
