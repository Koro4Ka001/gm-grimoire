import { useState } from 'react';
import { CombinedUnit, DamageType } from '@/types';
import { useDefenseStore } from '@/stores/defenseStore';
import { HealthBar } from './HealthBar';
import { ManaBar } from './ManaBar';
import { DAMAGE_TYPE_MAP, RESISTANCE_VALUES, getResistanceColor, RESISTANCE_LABELS } from '@/utils/damageTypes';
import { cn } from '@/utils/cn';

interface SelectionPanelProps {
  combinedUnits: CombinedUnit[];
  onOpenCalculator: () => void;
}

export function SelectionPanel({ combinedUnits, onOpenCalculator }: SelectionPanelProps) {
  const unitsWithGrimoire = combinedUnits.filter(u => u.hasGrimoireData);
  
  if (unitsWithGrimoire.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-sm text-gray-400">
          🎯 ВЫДЕЛЕНО: {unitsWithGrimoire.length} юнит(ов)
        </h2>
        <button
          onClick={onOpenCalculator}
          className="px-4 py-2 bg-red-900/50 hover:bg-red-800/60 text-red-200 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          ⚔️ Нанести урон
        </button>
      </div>
      
      {/* Unit Cards */}
      <div className="grid grid-cols-1 gap-2">
        {unitsWithGrimoire.map(unit => (
          <UnitCard key={unit.tokenId} unit={unit} />
        ))}
      </div>
    </div>
  );
}

interface UnitCardProps {
  unit: CombinedUnit;
}

function UnitCard({ unit }: UnitCardProps) {
  const [showArmorEditor, setShowArmorEditor] = useState(false);
  
  const isDead = unit.hp <= 0;
  const hpPercent = unit.maxHp > 0 ? (unit.hp / unit.maxHp) * 100 : 0;
  
  // Считаем количество модификаторов
  const multiplierCount = Object.keys(unit.multipliers).filter(k => unit.multipliers[k as DamageType] !== 1).length;
  const armorByTypeCount = Object.keys(unit.armorByType).length;

  return (
    <>
      <div 
        className={cn(
          'rounded-lg overflow-hidden transition-all duration-200',
          'bg-[#16161f] border border-[#2a2a3a]',
          isDead && 'opacity-50 grayscale',
          hpPercent <= 10 && !isDead && 'animate-critical',
          'hover:border-[#3a3a4a]'
        )}
      >
        {/* Header */}
        <div className="px-3 py-2 flex items-center gap-2 bg-[#0d0d12]">
          <h3 className="font-cinzel font-semibold text-sm flex-1 truncate">
            {unit.name}
          </h3>
          <button
            onClick={() => setShowArmorEditor(true)}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              unit.hasDefenseData 
                ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/60' 
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/60'
            )}
          >
            ⚙️ Броня
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-8">HP:</span>
            <HealthBar 
              current={unit.hp} 
              max={unit.maxHp} 
              temp={unit.tempHp}
              size="md"
              className="flex-1"
            />
          </div>
          
          {unit.mana !== null && unit.maxMana !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">MP:</span>
              <ManaBar 
                current={unit.mana} 
                max={unit.maxMana}
                size="sm"
                className="flex-1"
              />
            </div>
          )}
          
          {/* Defense Info */}
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <span>
              🛡️ Броня: <span className="font-mono text-white">{unit.flatArmor}</span>
              {armorByTypeCount > 0 && (
                <span className="text-gray-500 ml-1">(+{armorByTypeCount} тип.)</span>
              )}
            </span>
            
            {multiplierCount > 0 && (
              <span>📊 <span className="text-purple-400">{multiplierCount}</span> резистов</span>
            )}
          </div>
          
          {/* Quick multiplier display */}
          {multiplierCount > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(unit.multipliers)
                .filter(([_, val]) => val !== 1)
                .slice(0, 6)
                .map(([type, value]) => {
                  const typeInfo = DAMAGE_TYPE_MAP[type as DamageType];
                  return (
                    <span 
                      key={type}
                      className="px-1.5 py-0.5 text-[10px] bg-[#0a0a10] rounded flex items-center gap-0.5"
                      title={`${typeInfo?.nameRu}: ×${value}`}
                    >
                      <span>{typeInfo?.icon}</span>
                      <span 
                        className="font-mono"
                        style={{ color: getResistanceColor(value as number) }}
                      >
                        ×{value}
                      </span>
                    </span>
                  );
                })}
              {multiplierCount > 6 && (
                <span className="text-[10px] text-gray-500">+{multiplierCount - 6}</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Armor Editor Modal */}
      {showArmorEditor && (
        <ArmorEditor 
          unit={unit} 
          onClose={() => setShowArmorEditor(false)} 
        />
      )}
    </>
  );
}

// ============== ARMOR EDITOR ==============

interface ArmorEditorProps {
  unit: CombinedUnit;
  onClose: () => void;
}

function ArmorEditor({ unit, onClose }: ArmorEditorProps) {
  // Получаем актуальные данные напрямую из store
  const defenseData = useDefenseStore(s => s.units[unit.tokenId]);
  const {
    setFlatArmor,
    setArmorByType,
    removeArmorByType,
    setMultiplier,
    removeMultiplier,
    clearUnit,
  } = useDefenseStore();
  
  // Используем данные из store или дефолтные значения
  const flatArmor = defenseData?.flatArmor ?? unit.flatArmor ?? 0;
  const armorByType = defenseData?.armorByType ?? unit.armorByType ?? {};
  const multipliers = defenseData?.multipliers ?? unit.multipliers ?? {};
  
  const [newArmorType, setNewArmorType] = useState<DamageType | ''>('');
  const [newArmorValue, setNewArmorValue] = useState(5);
  const [newMultType, setNewMultType] = useState<DamageType | ''>('');
  
  const handleAddArmorByType = () => {
    if (newArmorType && newArmorValue > 0) {
      setArmorByType(unit.tokenId, newArmorType, newArmorValue);
      setNewArmorType('');
      setNewArmorValue(5);
    }
  };
  
  const handleAddMultiplier = (type: DamageType, value: number) => {
    setMultiplier(unit.tokenId, type, value);
    setNewMultType('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2a2a3a] flex items-center justify-between bg-[#0d0d12]">
          <h2 className="font-cinzel text-lg font-bold flex items-center gap-2">
            🛡️ БРОНЯ: {unit.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Flat Armor */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 uppercase tracking-wider">
              ОБЩАЯ БРОНЯ (от любого урона):
            </label>
            <input
              type="number"
              value={flatArmor}
              onChange={(e) => setFlatArmor(unit.tokenId, parseInt(e.target.value) || 0)}
              min={0}
              className="w-full bg-[#0a0a10] border border-[#2a2a3a] rounded-lg px-4 py-3 font-mono text-xl text-center focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div className="border-t border-[#2a2a3a] pt-4">
            {/* Armor by Type */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 uppercase tracking-wider">
                ДОПОЛНИТЕЛЬНАЯ БРОНЯ ПО ТИПАМ:
              </label>
              
              {/* Add new */}
              <div className="flex gap-2">
                <select
                  value={newArmorType}
                  onChange={(e) => setNewArmorType(e.target.value as DamageType)}
                  className="flex-1 bg-[#0a0a10] border border-[#2a2a3a] rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Выберите тип...</option>
                  <optgroup label="Физический">
                    {Object.values(DAMAGE_TYPE_MAP)
                      .filter(t => t.category === 'physical' && !(t.key in armorByType))
                      .map(t => (
                        <option key={t.key} value={t.key}>{t.icon} {t.nameRu}</option>
                      ))}
                  </optgroup>
                  <optgroup label="Магический">
                    {Object.values(DAMAGE_TYPE_MAP)
                      .filter(t => t.category === 'magical' && !(t.key in armorByType))
                      .map(t => (
                        <option key={t.key} value={t.key}>{t.icon} {t.nameRu}</option>
                      ))}
                  </optgroup>
                </select>
                <input
                  type="number"
                  value={newArmorValue}
                  onChange={(e) => setNewArmorValue(parseInt(e.target.value) || 0)}
                  min={1}
                  placeholder="5"
                  className="w-20 bg-[#0a0a10] border border-[#2a2a3a] rounded px-3 py-2 font-mono text-center text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddArmorByType}
                  disabled={!newArmorType || newArmorValue <= 0}
                  className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800/60 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
                >
                  + Добавить
                </button>
              </div>
              
              {/* Existing armor by type */}
              {Object.entries(armorByType).length > 0 && (
                <div className="space-y-1 mt-2">
                  <span className="text-xs text-gray-500">Добавлено:</span>
                  {Object.entries(armorByType).map(([type, value]) => {
                    const typeInfo = DAMAGE_TYPE_MAP[type as DamageType];
                    return (
                      <div key={type} className="flex items-center gap-2 bg-[#0a0a10] rounded px-3 py-2">
                        <span>{typeInfo?.icon}</span>
                        <span className="text-sm flex-1">{typeInfo?.nameRu}:</span>
                        <span className="font-mono text-white">{value}</span>
                        <button
                          onClick={() => removeArmorByType(unit.tokenId, type as DamageType)}
                          className="text-red-400 hover:text-red-300 px-1"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-[#2a2a3a] pt-4">
            {/* Multipliers (Resistances) */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 uppercase tracking-wider">
                МНОЖИТЕЛИ (резисты / уязвимости):
              </label>
              
              {/* Add new multiplier */}
              <div className="space-y-2">
                <select
                  value={newMultType}
                  onChange={(e) => setNewMultType(e.target.value as DamageType)}
                  className="w-full bg-[#0a0a10] border border-[#2a2a3a] rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Выберите тип урона...</option>
                  <optgroup label="Физический">
                    {Object.values(DAMAGE_TYPE_MAP)
                      .filter(t => t.category === 'physical' && t.key !== 'pure' && !(t.key in multipliers))
                      .map(t => (
                        <option key={t.key} value={t.key}>{t.icon} {t.nameRu}</option>
                      ))}
                  </optgroup>
                  <optgroup label="Магический">
                    {Object.values(DAMAGE_TYPE_MAP)
                      .filter(t => t.category === 'magical' && !(t.key in multipliers))
                      .map(t => (
                        <option key={t.key} value={t.key}>{t.icon} {t.nameRu}</option>
                      ))}
                  </optgroup>
                </select>
                
                {newMultType && (
                  <div className="flex gap-1 flex-wrap">
                    {RESISTANCE_VALUES.map(v => (
                      <button
                        key={v}
                        onClick={() => handleAddMultiplier(newMultType, v)}
                        className="px-3 py-2 text-sm rounded transition-colors bg-[#0a0a10] hover:bg-purple-900/40"
                        style={{ color: getResistanceColor(v) }}
                      >
                        ×{v}
                        <span className="text-gray-500 ml-1 text-xs">{RESISTANCE_LABELS[v]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Existing multipliers */}
              {Object.entries(multipliers).length > 0 && (
                <div className="space-y-1 mt-2">
                  <span className="text-xs text-gray-500">Добавлено:</span>
                  {Object.entries(multipliers)
                    .filter(([_, v]) => v !== 1)
                    .map(([type, value]) => {
                      const typeInfo = DAMAGE_TYPE_MAP[type as DamageType];
                      return (
                        <div key={type} className="flex items-center gap-2 bg-[#0a0a10] rounded px-3 py-2">
                          <span>{typeInfo?.icon}</span>
                          <span className="text-sm flex-1">{typeInfo?.nameRu}:</span>
                          <select
                            value={value}
                            onChange={(e) => setMultiplier(unit.tokenId, type as DamageType, parseFloat(e.target.value))}
                            className="bg-transparent border border-[#2a2a3a] rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                            style={{ color: getResistanceColor(value as number) }}
                          >
                            {RESISTANCE_VALUES.map(v => (
                              <option key={v} value={v}>×{v} ({RESISTANCE_LABELS[v]})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeMultiplier(unit.tokenId, type as DamageType)}
                            className="text-red-400 hover:text-red-300 px-1"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a3a] bg-[#0d0d12] flex gap-2">
          <button
            onClick={() => clearUnit(unit.tokenId)}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg text-sm transition-colors"
          >
            🗑️ Сбросить всё
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
          >
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
