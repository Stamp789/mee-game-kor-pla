export const normalizeSearch = (value: string) => value.normalize('NFC').toLocaleLowerCase('th').trim().replace(/\s+/g, ' ');
export function matchesSearch(haystack: string, query: string): boolean {
  const text = normalizeSearch(haystack);
  return normalizeSearch(query).split(' ').every(word => text.includes(word));
}
export function searchTerms(mod: { title: string; thaiTitle: string; translator: string; tags: string[]; platform: string | string[] }): string {
  const platforms = Array.isArray(mod.platform) ? mod.platform : [mod.platform];
  return normalizeSearch([mod.title, mod.thaiTitle, mod.translator, ...mod.tags, ...platforms,
    platforms.includes('pc') ? 'windows' : '', platforms.includes('mac') ? 'macos' : '',
  ].join(' '));
}
