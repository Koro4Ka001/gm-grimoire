import { DamageType, DamageTypeInfo } from '@/types';

export const DAMAGE_TYPES: DamageTypeInfo[] = [
  // Физические
  { key: 'slashing', name: 'Slashing', nameRu: 'Режущий', icon: '⚔️', category: 'physical', color: '#c0c0c0' },
  { key: 'piercing', name: 'Piercing', nameRu: 'Колющий', icon: '🗡️', category: 'physical', color: '#a0a0a0' },
  { key: 'bludgeoning', name: 'Bludgeoning', nameRu: 'Дробящий', icon: '🔨', category: 'physical', color: '#808080' },
  { key: 'chopping', name: 'Chopping', nameRu: 'Рубящий', icon: '🪓', category: 'physical', color: '#b0b0b0' },
  
  // Магические
  { key: 'fire', name: 'Fire', nameRu: 'Огонь', icon: '🔥', category: 'magical', color: '#ff4500' },
  { key: 'water', name: 'Water', nameRu: 'Вода', icon: '💧', category: 'magical', color: '#1e90ff' },
  { key: 'earth', name: 'Earth', nameRu: 'Земля', icon: '🌍', category: 'magical', color: '#8b4513' },
  { key: 'air', name: 'Air', nameRu: 'Воздух', icon: '💨', category: 'magical', color: '#87ceeb' },
  { key: 'light', name: 'Light', nameRu: 'Свет', icon: '☀️', category: 'magical', color: '#ffd700' },
  { key: 'darkness', name: 'Darkness', nameRu: 'Тьма', icon: '🌑', category: 'magical', color: '#2f0a3c' },
  { key: 'space', name: 'Space', nameRu: 'Пространство', icon: '🌀', category: 'magical', color: '#9400d3' },
  { key: 'astral', name: 'Astral', nameRu: 'Астрал', icon: '✨', category: 'magical', color: '#e6e6fa' },
  { key: 'blight', name: 'Blight', nameRu: 'Скверна', icon: '☠️', category: 'magical', color: '#556b2f' },
  { key: 'electricity', name: 'Electricity', nameRu: 'Электричество', icon: '⚡', category: 'magical', color: '#00bfff' },
  { key: 'void', name: 'Void', nameRu: 'Пустота', icon: '🕳️', category: 'magical', color: '#0a0a14' },
  { key: 'life', name: 'Life', nameRu: 'Жизнь', icon: '💚', category: 'magical', color: '#00ff00' },
  { key: 'nature', name: 'Nature', nameRu: 'Природа', icon: '🌿', category: 'magical', color: '#228b22' },
  { key: 'death', name: 'Death', nameRu: 'Смерть', icon: '💀', category: 'magical', color: '#4a0080' },
  { key: 'horror', name: 'Horror', nameRu: 'Ужас', icon: '👁️', category: 'magical', color: '#8b0000' },
  
  // Особый
  { key: 'pure', name: 'Pure', nameRu: 'Чистый', icon: '💎', category: 'special', color: '#ffffff' },
];

export const DAMAGE_TYPE_MAP: Record<DamageType, DamageTypeInfo> = 
  DAMAGE_TYPES.reduce((acc, dt) => ({ ...acc, [dt.key]: dt }), {} as Record<DamageType, DamageTypeInfo>);

export const RESISTANCE_LABELS: Record<number, string> = {
  0: 'Иммунитет',
  0.25: 'Сильный резист',
  0.5: 'Резист',
  1: 'Нормально',
  1.5: 'Слабость',
  2: 'Уязвимость',
  3: 'Крит. уязвимость',
};

export const RESISTANCE_VALUES = [0, 0.25, 0.5, 1, 1.5, 2, 3];

export function getResistanceColor(multiplier: number): string {
  if (multiplier === 0) return '#00ff00';
  if (multiplier < 1) return '#44ff44';
  if (multiplier === 1) return '#888888';
  if (multiplier <= 1.5) return '#ffaa00';
  if (multiplier <= 2) return '#ff4444';
  return '#ff0000';
}
