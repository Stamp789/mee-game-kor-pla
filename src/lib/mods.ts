import { getCollection, type CollectionEntry } from 'astro:content';
export type Mod = CollectionEntry<'mods'>['data'] & { id: string };
export const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const url = (path = '') => `${base}${path.replace(/^\//, '')}`;
export const cover = (mod: Mod) => url(mod.cover.replace(/\.(png|jpe?g)$/i, '.webp'));
export const modUrl = (mod: Mod) => url(`mods/${mod.id}/`);
export const provider = (source: string) => ({ nexus: 'Nexus Mods', drive: 'Google Drive', mediafire: 'MediaFire' }[source] || source);
export const version = (value: string) => value === '—' ? 'ดูเวอร์ชันที่ต้นทาง' : `v${value.replace(/^v/i, '')}`;
export const date = (value: string) => new Intl.DateTimeFormat('th-TH-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(`${value}T00:00:00+07:00`));
export async function getMods(): Promise<Mod[]> {
  return (await getCollection('mods')).map(entry => ({ ...entry.data, id: entry.id })).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}
