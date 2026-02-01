import { useState, useMemo } from 'react';
import { CombinedUnit, DamageType } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { calculateDamage } from '@/utils/damageCalculator';
import { updateMultipleTokensHp } from '@/utils/updateHealthBar';
import { DAMAGE_TYPES, DAMAGE_TYPE_MAP } from '@/utils/damageTypes';
import { cn } from '@/utils/cn';

interface MassCalculatorProps {
  combinedUnits: CombinedUnit[];
  onClose: () => void;
}

export function MassCalculator({ combinedUnits, onClose }: MassCalculatorProps) {
  const units = combinedUnits;
  const { addHistoryEvent } = useAppStore();
  
  const [rawDamage, setRawDamage] = useState(10);
  const [damageType, setDamageType] = useState<DamageType>('slashing');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(units.map(u => u.tokenId)));
  const [isApplying, setIsApplying] = useState(false);
  
  // Расчёт для каждой цели
  const calculations = useMemo(() => {
    return units.map(unit => calculateDamage(unit, rawDamage, damageType));
  }, [units, rawDamage, damageType]);
  
  // Только выбранные для применения
  const selectedCalculations = calculations.filter(c => selectedIds.has(c.tokenId));
  
  // Переключение выбора юнита
  const toggleUnit = (tokenId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(tokenId)) {
        next.delete(tokenId);
      } else {
        next.add(tokenId);
      }
      return next;
    });
  };
  
  // Применение урона
  const handleApply = async () => {
    if (selectedCalculations.length === 0) return;
    
    setIsApplying(true);
    
    try {
      // Подготавливаем обновления (с maxHp для синхронизации HP bar)
      const updates = selectedCalculations.map(calc => ({
        tokenId: calc.tokenId,
        newHp: calc.newHp,
        maxHp: calc.maxHp,
      }));
      
      // Обновляем HP в metadata И синхронизируем HP bar
      const result = await updateMultipleTokensHp(updates);
      
      // Логируем события
      for (const calc of selectedCalculations) {
        addHistoryEvent({
          targetId: calc.tokenId,
          targetName: calc.name,
          rawDamage: calc.rawDamage,
          damageType: calc.damageType,
          finalDamage: calc.finalDamage,
          overkill: calc.overkill,
          hpBefore: calc.originalHp,
          hpAfter: calc.newHp,
        });
      }
      
      // Показываем результат
      if (result.success > 0) {
        console.log(`[Calculator] Applied to ${result.success} targets`);
      }
      if (result.failed > 0) {
        console.error(`[Calculator] Failed for ${result.failed} targets`);
      }
      
      // Закрываем если всё успешно
      if (result.failed === 0) {
        onClose();
      }
    } catch (error) {
      console.error('[Calculator] Error applying:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const physicalTypes = DAMAGE_TYPES.filter(t => t.category === 'physical');
  const magicalTypes = DAMAGE_TYPES.filter(t => t.category === 'magical');
  const specialTypes = DAMAGE_TYPES.filter(t => t.category === 'special');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2a2a3a] flex items-center justify-between bg-[#0d0d12]">
          <h2 className="font-cinzel text-lg font-bold flex items-center gap-2">
            ⚔️ НАНЕСТИ УРОН
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Damage Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">КОЛИЧЕСТВО:</label>
            <input
              type="number"
              value={rawDamage}
              onChange={(e) => setRawDamage(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-4 text-3xl font-mono text-center text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          
          {/* Damage Type Selection */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">ТИП УРОНА:</label>
            
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value as DamageType)}
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-purple-500"
            >
              <optgroup label="Физический">
                {physicalTypes.map(type => (
                  <option key={type.key} value={type.key}>{type.icon} {type.nameRu}</option>
                ))}
              </optgroup>
              <optgroup label="Магический">
                {magicalTypes.map(type => (
                  <option key={type.key} value={type.key}>{type.icon} {type.nameRu}</option>
                ))}
              </optgroup>
              <optgroup label="Особый">
                {specialTypes.map(type => (
                  <option key={type.key} value={type.key}>{type.icon} {type.nameRu} (игнорирует защиту)</option>
                ))}
              </optgroup>
            </select>
          </div>
          
          {/* Preview / Target Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">ПРЕВЬЮ ({selectedIds.size}/{units.length}):</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(new Set(units.map(u => u.tokenId)))}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Выбрать все
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-400"
                >
                  Снять все
                </button>
              </div>
            </div>
            
            <div className="bg-[#0a0a0f] rounded-lg border border-[#2a2a3a] divide-y divide-[#2a2a3a]">
              {calculations.map((calc) => {
                const isSelected = selectedIds.has(calc.tokenId);
                const typeInfo = DAMAGE_TYPE_MAP[calc.damageType];
                
                return (
                  <button
                    key={calc.tokenId}
                    onClick={() => toggleUnit(calc.tokenId)}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-3 text-left transition-colors',
                      isSelected ? 'bg-purple-900/20' : 'hover:bg-[#12121a]'
                    )}
                  >
                    <span className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center text-xs mt-0.5',
                      isSelected ? 'bg-purple-600 border-purple-500' : 'border-gray-600'
                    )}>
                      {isSelected && '✓'}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{calc.name}:</span>
                        <span className="font-mono text-sm text-gray-400">{calc.breakdown}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>HP: {calc.originalHp} → {calc.newHp}</span>
                        {calc.isDead && <span className="text-red-400">💀 СМЕРТЬ</span>}
                        {calc.overkill > 0 && <span className="text-red-400">(overkill: {calc.overkill})</span>}
                      </div>
                    </div>
                    
                    <div className={cn(
                      'font-mono text-lg',
                      calc.finalDamage === 0 ? 'text-blue-400' : 'text-red-400'
                    )}>
                      -{calc.finalDamage} {typeInfo?.icon}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Summary */}
            {selectedCalculations.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                <div className="bg-[#0a0a0f] rounded-lg p-2 text-center">
                  <div className="text-gray-400 text-xs">Целей</div>
                  <div className="font-mono text-lg">{selectedCalculations.length}</div>
                </div>
                <div className="bg-[#0a0a0f] rounded-lg p-2 text-center">
                  <div className="text-gray-400 text-xs">Общий урон</div>
                  <div className="font-mono text-lg text-red-400">
                    {selectedCalculations.reduce((sum, c) => sum + c.finalDamage, 0)}
                  </div>
                </div>
                <div className="bg-[#0a0a0f] rounded-lg p-2 text-center">
                  <div className="text-gray-400 text-xs">Убийств</div>
                  <div className="font-mono text-lg text-purple-400">
                    {selectedCalculations.filter(c => c.isDead).length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a3a] bg-[#0d0d12]">
          <button
            onClick={handleApply}
            disabled={selectedIds.size === 0 || isApplying}
            className={cn(
              'w-full py-4 rounded-lg font-bold text-xl transition-colors',
              selectedIds.size > 0 && !isApplying
                ? 'bg-red-800 hover:bg-red-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            {isApplying 
              ? '⏳ Применяется...' 
              : `⚔️ ПРИМЕНИТЬ УРОН`}
          </button>
        </div>
      </div>
    </div>
  );
}
