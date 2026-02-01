// Все 19 типов урона
export type DamageType = 
  // Физические (4)
  | 'slashing' | 'piercing' | 'bludgeoning' | 'chopping'
  // Магические (15)
  | 'fire' | 'water' | 'earth' | 'air' | 'light' | 'darkness' 
  | 'space' | 'astral' | 'blight' | 'electricity' | 'void'
  | 'life' | 'nature' | 'death' | 'horror'
  // Особый (1)
  | 'pure';

// Множители резистов
export type ResistanceMultiplier = 0 | 0.5 | 1 | 1.5 | 2;

// Данные из GM Grimoire (прочитанные из metadata токена)
export interface GrimoireUnit {
  hp: number;
  maxHp: number;
  tempHp: number;
  mana: number | null;
  maxMana: number | null;
  armor: number;
  name: string;
}

// Выделенный токен на карте
export interface SelectedToken {
  tokenId: string;
  tokenName: string;
  grimoire: GrimoireUnit | null;
  image?: string;
  position: { x: number; y: number };
}

// Защита юнита (хранится локально) — УПРОЩЁННАЯ ВЕРСИЯ
export interface UnitDefense {
  tokenId: string;
  
  // Общая плоская броня (вычитается от любого урона кроме Чистого)
  flatArmor: number;
  
  // Плоская броня по типам (вычитается дополнительно)
  armorByType: Partial<Record<DamageType, number>>;
  
  // Множители (резисты/уязвимости)
  multipliers: Partial<Record<DamageType, number>>;
  
  // Мета
  lastModified: number;
}

// Комбинированный юнит (данные Grimoire + локальные защиты)
export interface CombinedUnit {
  tokenId: string;
  name: string;
  image?: string;
  
  // Данные из Grimoire
  hp: number;
  maxHp: number;
  tempHp: number;
  mana: number | null;
  maxMana: number | null;
  
  // Защита (комбинированная)
  flatArmor: number;
  armorByType: Partial<Record<DamageType, number>>;
  multipliers: Partial<Record<DamageType, number>>;
  
  // Флаги
  hasGrimoireData: boolean;
  hasDefenseData: boolean;
}

// Результат расчёта урона для одной цели
export interface DamageResult {
  tokenId: string;
  name: string;
  
  // Входные данные
  rawDamage: number;
  damageType: DamageType;
  
  // Пошаговый расчёт
  multiplier: number;
  afterMultiplier: number;
  flatArmorReduction: number;
  typeArmorReduction: number;
  
  // Итог
  finalDamage: number;
  
  // Результат для HP
  originalHp: number;
  maxHp: number;  // Для синхронизации HP bar
  newHp: number;
  overkill: number;
  isDead: boolean;
  
  // Для отображения
  breakdown: string;
}

// Событие урона для истории
export interface HistoryEvent {
  id: string;
  timestamp: number;
  targetId: string;
  targetName: string;
  
  rawDamage: number;
  damageType: DamageType;
  
  finalDamage: number;
  overkill: number;
  
  hpBefore: number;
  hpAfter: number;
}

// Информация о типе урона
export interface DamageTypeInfo {
  key: DamageType;
  name: string;
  nameRu: string;
  icon: string;
  category: 'physical' | 'magical' | 'special';
  color: string;
}
