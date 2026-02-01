import { DamageType, CombinedUnit, DamageResult } from '@/types';

/**
 * Рассчитывает урон для цели
 * Формула: Итоговый = (Входящий × Множитель) − ПлоскаяБроня − ПлоскаяБроняПоТипу
 */
export function calculateDamage(
  unit: CombinedUnit,
  rawDamage: number,
  damageType: DamageType
): DamageResult {
  // Чистый урон игнорирует ВСЁ
  if (damageType === 'pure') {
    const finalDamage = Math.max(0, rawDamage);
    const newHp = Math.max(0, unit.hp - finalDamage);
    const overkill = finalDamage > unit.hp ? finalDamage - unit.hp : 0;
    
    return {
      tokenId: unit.tokenId,
      name: unit.name,
      rawDamage,
      damageType,
      multiplier: 1,
      afterMultiplier: rawDamage,
      flatArmorReduction: 0,
      typeArmorReduction: 0,
      finalDamage,
      originalHp: unit.hp,
      newHp,
      overkill,
      isDead: newHp <= 0,
      breakdown: `${rawDamage} (чистый) = ${rawDamage}`,
    };
  }
  
  // Получаем множитель (по умолчанию 1)
  const multiplier = unit.multipliers[damageType] ?? 1;
  const afterMultiplier = Math.floor(rawDamage * multiplier);
  
  // Плоская броня
  const flatArmorReduction = unit.flatArmor;
  
  // Броня по типу
  const typeArmorReduction = unit.armorByType[damageType] ?? 0;
  
  // Общее снижение
  const totalReduction = flatArmorReduction + typeArmorReduction;
  
  // Итоговый урон
  const finalDamage = Math.max(0, afterMultiplier - totalReduction);
  
  // Новый HP
  const newHp = Math.max(0, unit.hp - finalDamage);
  const overkill = finalDamage > unit.hp ? finalDamage - unit.hp : 0;
  const isDead = newHp <= 0;
  
  // Формируем breakdown
  let breakdown = `${rawDamage}`;
  if (multiplier !== 1) {
    breakdown += ` × ${multiplier} = ${afterMultiplier}`;
  }
  if (totalReduction > 0) {
    breakdown += ` − ${totalReduction}`;
  }
  breakdown += ` = ${finalDamage}`;
  
  return {
    tokenId: unit.tokenId,
    name: unit.name,
    rawDamage,
    damageType,
    multiplier,
    afterMultiplier,
    flatArmorReduction,
    typeArmorReduction,
    finalDamage,
    originalHp: unit.hp,
    newHp,
    overkill,
    isDead,
    breakdown,
  };
}

/**
 * Массовый расчёт урона для нескольких целей
 */
export function calculateMassDamage(
  units: CombinedUnit[],
  rawDamage: number,
  damageType: DamageType
): DamageResult[] {
  return units.map(unit => calculateDamage(unit, rawDamage, damageType));
}

/**
 * Получить описание множителя
 */
export function getMultiplierLabel(multiplier: number): string {
  if (multiplier === 0) return 'иммунитет';
  if (multiplier === 0.5) return 'резист';
  if (multiplier === 1) return 'нормально';
  if (multiplier === 1.5) return 'слабость';
  if (multiplier === 2) return 'уязвимость';
  return `×${multiplier}`;
}
