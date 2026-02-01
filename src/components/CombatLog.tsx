import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { DAMAGE_TYPE_MAP } from '@/utils/damageTypes';
import { HistoryEvent, DamageType } from '@/types';
import { cn } from '@/utils/cn';

export function CombatLog() {
  const { history, clearHistory } = useAppStore();
  const [expanded, setExpanded] = useState(true);
  
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#12121a] rounded-xl border border-[#2a2a3a] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-[#0d0d12] border-b border-[#2a2a3a] flex items-center justify-between hover:bg-[#12121a] transition-colors"
      >
        <h3 className="font-cinzel font-bold text-sm flex items-center gap-2">
          📜 ИСТОРИЯ
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{history.length} событий</span>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      
      {expanded && (
        <>
          {/* Event List */}
          <div className="max-h-48 overflow-y-auto p-2 space-y-1">
            {history.map((event: HistoryEvent) => {
              const typeInfo = DAMAGE_TYPE_MAP[event.damageType as DamageType];
              const time = new Date(event.timestamp).toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit',
              });
              
              return (
                <div 
                  key={event.id}
                  className={cn(
                    'px-2 py-1.5 rounded text-xs bg-red-900/20'
                  )}
                >
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-gray-500">{time}</span>
                    <span className="text-red-300">{event.targetName}:</span>
                    <span className="font-mono font-bold">-{event.finalDamage}</span>
                    <span>{typeInfo?.icon}</span>
                    <span className="text-gray-400">{typeInfo?.nameRu}</span>
                    {event.overkill > 0 && <span className="text-red-500">💀</span>}
                  </div>
                  
                  {/* HP change */}
                  <div className="text-gray-500 text-[10px]">
                    HP: {event.hpBefore} → {event.hpAfter}
                    {event.overkill > 0 && <span className="text-red-500 ml-1">(overkill: {event.overkill})</span>}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Controls */}
          <div className="p-2 border-t border-[#2a2a3a]">
            <button
              onClick={clearHistory}
              className="w-full py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg text-xs transition-colors"
            >
              🗑️ Очистить
            </button>
          </div>
        </>
      )}
    </div>
  );
}
