// Read headers only; do not download mod archives or use user credentials.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
const folder = new URL('../src/content/mods/', import.meta.url);
const records = await Promise.all((await readdir(folder)).filter(file => file.endsWith('.json')).map(async file => JSON.parse(await readFile(new URL(file, folder), 'utf8'))));
const targets = new Map();
for (const mod of records) for (const provider of ['nexus','drive','mediafire']) if (mod[provider]) {
  const entry = targets.get(mod[provider]) || { url: mod[provider], provider, games: [] }; entry.games.push(mod.id); targets.set(entry.url, entry);
}
const queue = [...targets.values()]; const results = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const target = queue.shift();
    try {
      const response = await fetch(target.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000) });
      results.push({ ...target, status: response.status, finalUrl: response.url, result: response.ok ? 'reachable' : [401,403,405,429,503].includes(response.status) ? 'requires-browser-check' : 'unconfirmed' });
    } catch (error) { results.push({ ...target, result: 'unconfirmed', reason: error.name }); }
  }
}));
results.sort((a,b) => a.url.localeCompare(b.url));
const reportDir = new URL('../artifacts/qa/', import.meta.url); await mkdir(reportDir, { recursive: true });
await writeFile(new URL('download-audit.json', reportDir), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ checked: results.length, reachable: results.filter(item => item.result === 'reachable').length, requiresBrowser: results.filter(item => item.result === 'requires-browser-check').length, unconfirmed: results.filter(item => item.result === 'unconfirmed').length }));
