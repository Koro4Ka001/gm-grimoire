import { GrimoireUnit } from '@/types';

// Ключ HP Tracker от bitperfect-software
const HP_TRACKER_KEY = 'com.bitperfect-software.hp-tracker/data';

// Возможные префиксы ключей в metadata (для других расширений)
const POSSIBLE_PREFIXES = [
  'com.battle-system.gmg',
  'com.battle-system',
  'com.grimoire',
  'grimoire',
  'battle-system',
  'hp-tracker',
  'com.hp-tracker',
];

// Попытка найти HP ключ в metadata
function findValue(
  metadata: Record<string, unknown>,
  prefix: string,
  keys: string[]
): unknown | undefined {
  for (const key of keys) {
    const fullKey = `${prefix}/${key}`;
    if (fullKey in metadata) {
      return metadata[fullKey];
    }
  }
  return undefined;
}

// Парсинг плоской структуры metadata
function parseFlatStructure(
  metadata: Record<string, unknown>,
  prefix: string
): GrimoireUnit | null {
  const hp = findValue(metadata, prefix, ['hp', 'currentHp', 'current-hp']);
  
  if (hp === undefined) return null;
  
  const maxHp = findValue(metadata, prefix, ['maxHp', 'max-hp', 'hpMax', 'hp-max']) ?? hp;
  const tempHp = findValue(metadata, prefix, ['tempHp', 'temp-hp', 'temporaryHp']) ?? 0;
  const mana = findValue(metadata, prefix, ['mana', 'mp', 'currentMana']);
  const maxMana = findValue(metadata, prefix, ['maxMana', 'max-mana', 'manaMax']);
  const armor = findValue(metadata, prefix, ['ac', 'armor', 'defence', 'defense']) ?? 0;
  const name = findValue(metadata, prefix, ['name', 'displayName']) ?? '';
  
  return {
    hp: Number(hp),
    maxHp: Number(maxHp),
    tempHp: Number(tempHp),
    mana: mana !== undefined ? Number(mana) : null,
    maxMana: maxMana !== undefined ? Number(maxMana) : null,
    armor: Number(armor),
    name: String(name),
  };
}

// Парсинг HP Tracker от bitperfect-software
function parseBitperfectHpTracker(
  metadata: Record<string, unknown>
): GrimoireUnit | null {
  const data = metadata[HP_TRACKER_KEY];
  
  if (!data || typeof data !== 'object') return null;
  
  const obj = data as Record<string, unknown>;
  
  // HP Tracker хранит только hp и maxHp
  const hp = obj.hp;
  if (hp === undefined) return null;
  
  const maxHp = obj.maxHp ?? hp;
  
  return {
    hp: Number(hp),
    maxHp: Number(maxHp),
    tempHp: 0,
    mana: null,
    maxMana: null,
    armor: 0,
    name: '',
  };
}

// Парсинг вложенной структуры metadata
function parseNestedStructure(
  metadata: Record<string, unknown>
): GrimoireUnit | null {
  // Ищем объекты, которые могут содержать HP данные
  for (const key of Object.keys(metadata)) {
    const value = metadata[key];
    
    if (typeof value !== 'object' || value === null) continue;
    
    const obj = value as Record<string, unknown>;
    
    // Проверяем наличие hp-подобных ключей
    const hp = obj.hp ?? obj.currentHp ?? obj['current-hp'];
    if (hp === undefined) continue;
    
    return {
      hp: Number(hp),
      maxHp: Number(obj.maxHp ?? obj['max-hp'] ?? obj.hpMax ?? hp),
      tempHp: Number(obj.tempHp ?? obj['temp-hp'] ?? 0),
      mana: obj.mana !== undefined ? Number(obj.mana) : null,
      maxMana: obj.maxMana !== undefined ? Number(obj.maxMana) : null,
      armor: Number(obj.ac ?? obj.armor ?? obj.defence ?? 0),
      name: String(obj.name ?? obj.displayName ?? ''),
    };
  }
  
  return null;
}

/**
 * Парсит metadata токена OBR и извлекает данные HP
 */
export function parseGrimoireData(
  metadata: Record<string, unknown>
): GrimoireUnit | null {
  // 1. Сначала проверяем HP Tracker от bitperfect-software
  const hpTrackerResult = parseBitperfectHpTracker(metadata);
  if (hpTrackerResult) {
    console.log('[Parser] Found HP Tracker (bitperfect):', hpTrackerResult);
    return hpTrackerResult;
  }
  
  // 2. Пробуем плоскую структуру с разными префиксами
  for (const prefix of POSSIBLE_PREFIXES) {
    const result = parseFlatStructure(metadata, prefix);
    if (result) {
      console.log('[Parser] Found flat structure with prefix:', prefix);
      return result;
    }
  }
  
  // 3. Пробуем вложенную структуру
  const nestedResult = parseNestedStructure(metadata);
  if (nestedResult) {
    console.log('[Parser] Found nested structure');
    return nestedResult;
  }
  
  return null;
}

/**
 * Определяет какой prefix использует HP в metadata токена
 */
export function detectGrimoirePrefix(
  metadata: Record<string, unknown>
): string | null {
  // Проверяем HP Tracker от bitperfect
  if (HP_TRACKER_KEY in metadata) {
    return HP_TRACKER_KEY;
  }
  
  for (const prefix of POSSIBLE_PREFIXES) {
    const hp = findValue(metadata, prefix, ['hp', 'currentHp', 'current-hp']);
    if (hp !== undefined) {
      return prefix;
    }
  }
  
  // Проверяем вложенные структуры
  for (const key of Object.keys(metadata)) {
    const value = metadata[key];
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if ('hp' in obj || 'currentHp' in obj) {
        return key;
      }
    }
  }
  
  return null;
}

/**
 * Находит ключ HP в metadata
 */
export function findHpKey(
  metadata: Record<string, unknown>,
  prefix: string
): string | null {
  const hpKeys = ['hp', 'currentHp', 'current-hp'];
  
  for (const key of hpKeys) {
    const fullKey = `${prefix}/${key}`;
    if (fullKey in metadata) {
      return fullKey;
    }
  }
  
  // Для вложенной структуры
  if (prefix in metadata) {
    const obj = metadata[prefix];
    if (typeof obj === 'object' && obj !== null) {
      if ('hp' in obj) return 'hp';
      if ('currentHp' in obj) return 'currentHp';
    }
  }
  
  return null;
}

/**
 * Находит ключ Temp HP в metadata
 */
export function findTempHpKey(
  metadata: Record<string, unknown>,
  prefix: string
): string | null {
  const tempKeys = ['tempHp', 'temp-hp', 'temporaryHp'];
  
  for (const key of tempKeys) {
    const fullKey = `${prefix}/${key}`;
    if (fullKey in metadata) {
      return fullKey;
    }
  }
  
  return null;
}
