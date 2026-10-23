import type { Mod } from './mods';

export const genres = [
  { id: 'all', label: 'ทุกแนวเกม', tags: [] },
  { id: 'rpg', label: 'RPG / JRPG', tags: ['rpg', 'jrpg', 'action rpg', 'classic rpg'] },
  { id: 'action', label: 'แอ็กชัน', tags: ['action', 'action rpg', 'hack and slash', "beat 'em up", 'roguelite', 'roguelike', 'platformer', 'metroidvania'] },
  { id: 'adventure', label: 'ผจญภัย / ไขปริศนา', tags: ['adventure', 'puzzle', 'visual novel', 'เนื้อเรื่อง'] },
  { id: 'strategy', label: 'วางแผน / เทิร์นเบส', tags: ['strategy', '4x', 'turn-based', 'rts', 'tactical'] },
  { id: 'simulation', label: 'จำลอง / บริหาร', tags: ['simulation', 'management', 'tycoon', 'cooking', 'cozy'] },
  { id: 'horror', label: 'สยองขวัญ', tags: ['horror'] },
];

export function modGenres(mod: Pick<Mod, 'tags'>): string[] {
  const tags = mod.tags.map(tag => tag.toLocaleLowerCase('th'));
  return genres.filter(genre => genre.id !== 'all' && genre.tags.some(tag => tags.includes(tag))).map(genre => genre.id);
}
