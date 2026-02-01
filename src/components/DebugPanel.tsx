import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useDefenseStore } from '@/stores/defenseStore';
import OBR from '@owlbear-rodeo/sdk';

export function DebugPanel() {
  const { selectedTokens, isObrReady } = useAppStore();
  const defenseUnits = useDefenseStore(s => s.units);
  const [rawMetadata, setRawMetadata] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'storage'>('tokens');
  
  useEffect(() => {
    if (!isObrReady || selectedTokens.length === 0) {
      setRawMetadata([]);
      return;
    }
    
    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const tokenIds = selectedTokens.map(t => t.tokenId);
        const items = await OBR.scene.items.getItems(tokenIds);
        setRawMetadata(items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          metadata: item.metadata,
        })));
      } catch (error) {
        console.error('[Debug] Error fetching metadata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetadata();
  }, [selectedTokens, isObrReady]);
  
  // Функция для debug attachments токена
  const debugTokenAttachments = async (tokenId: string) => {
    try {
      const allItems = await OBR.scene.items.getItems();
      const attachments = allItems.filter(item => item.attachedTo === tokenId);
      
      console.log(`[Debug] Token ${tokenId} has ${attachments.length} attachments:`);
      
      attachments.forEach((att, i) => {
        console.log(`[Debug] Attachment ${i + 1}:`, {
          id: att.id,
          type: att.type,
          name: att.name,
          metadata: att.metadata,
        });
      });
      
      alert(`Найдено ${attachments.length} attachments. Смотри консоль (F12)`);
    } catch (error) {
      console.error('[Debug] Error getting attachments:', error);
    }
  };

  return (
    <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-cinzel text-sm text-purple-400">🔧 DEBUG PANEL</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-2 py-1 text-xs rounded ${activeTab === 'tokens' ? 'bg-purple-700 text-white' : 'bg-[#0a0a10] text-gray-400'}`}
          >
            Токены
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-2 py-1 text-xs rounded ${activeTab === 'storage' ? 'bg-purple-700 text-white' : 'bg-[#0a0a10] text-gray-400'}`}
          >
            Хранилище
          </button>
        </div>
      </div>
      
      {activeTab === 'tokens' && (
        <>
          {selectedTokens.length === 0 ? (
            <p className="text-gray-500 text-sm">Выделите токены для просмотра metadata</p>
          ) : loading ? (
            <p className="text-gray-500 text-sm">Загрузка...</p>
          ) : (
            <div className="space-y-4">
              {rawMetadata.map((item, idx) => (
                <div key={item.id as string} className="bg-[#0a0a0f] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-400 font-mono text-xs">#{idx + 1}</span>
                    <span className="text-white font-semibold">{item.name as string}</span>
                    <span className="text-gray-500 text-xs">({item.type as string})</span>
                    <button
                      onClick={() => debugTokenAttachments(item.id as string)}
                      className="ml-auto px-2 py-1 text-xs bg-purple-900/50 hover:bg-purple-800/60 text-purple-300 rounded"
                    >
                      🔍 Debug HP Bar
                    </button>
                  </div>
                  
                  <div className="text-xs">
                    <span className="text-gray-400">ID: </span>
                    <span className="font-mono text-gray-500">{item.id as string}</span>
                  </div>
                  
                  {/* Grimoire Detection */}
                  <div className="mt-2 space-y-1">
                    <span className="text-xs text-amber-400">🔍 Найденные ключи HP/Mana:</span>
                    {Object.entries(item.metadata as object).map(([key, value]) => {
                      const lowerKey = key.toLowerCase();
                      const isHpKey = lowerKey.includes('hp') || lowerKey.includes('health');
                      const isManaKey = lowerKey.includes('mana') || lowerKey.includes('mp');
                      const isArmorKey = lowerKey.includes('armor') || lowerKey.includes('ac') || lowerKey.includes('defence');
                      
                      if (!isHpKey && !isManaKey && !isArmorKey) {
                        // Также проверяем вложенные объекты
                        if (typeof value === 'object' && value !== null) {
                          const hasHp = 'hp' in value || 'currentHp' in value;
                          if (hasHp) {
                            return (
                              <div key={key} className="flex items-center gap-2 text-xs bg-green-900/30 px-2 py-1 rounded">
                                <span className="text-green-400">✅</span>
                                <span className="font-mono text-gray-400">{key}:</span>
                                <span className="font-mono text-white">{JSON.stringify(value)}</span>
                              </div>
                            );
                          }
                        }
                        return null;
                      }
                      
                      return (
                        <div key={key} className="flex items-center gap-2 text-xs bg-green-900/30 px-2 py-1 rounded">
                          <span className={
                            isHpKey ? 'text-red-400' : 
                            isManaKey ? 'text-blue-400' : 
                            'text-amber-400'
                          }>
                            {isHpKey ? '❤️' : isManaKey ? '💎' : '🛡️'}
                          </span>
                          <span className="font-mono text-gray-400">{key}:</span>
                          <span className="font-mono text-white">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer text-purple-400 text-xs hover:text-purple-300">
                      Все metadata ({Object.keys(item.metadata as object).length} ключей)
                    </summary>
                    <pre className="mt-2 p-2 bg-[#12121a] rounded text-xs overflow-x-auto text-gray-300 max-h-60 overflow-y-auto">
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'storage' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Локально сохранённые данные защиты:</p>
          
          {Object.keys(defenseUnits).length === 0 ? (
            <p className="text-gray-500 text-sm">Нет сохранённых данных</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(defenseUnits).map(([tokenId, defense]) => (
                <div key={tokenId} className="bg-[#0a0a0f] rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-purple-400 truncate max-w-[200px]" title={tokenId}>
                      {tokenId.substring(0, 20)}...
                    </span>
                    <span className="text-gray-500">
                      {new Date(defense.lastModified).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-gray-400">
                    <div>🛡️ Броня: <span className="text-white">{defense.flatArmor}</span></div>
                    <div>📊 Резисты: <span className="text-white">{Object.keys(defense.multipliers).length}</span></div>
                    <div>🔰 Тип. броня: <span className="text-white">{Object.keys(defense.armorByType).length}</span></div>
                  </div>
                  
                  {Object.keys(defense.multipliers).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
                        Множители
                      </summary>
                      <pre className="mt-1 p-2 bg-[#12121a] rounded text-gray-300 overflow-x-auto">
                        {JSON.stringify(defense.multipliers, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={() => {
              if (confirm('Очистить все сохранённые данные защиты?')) {
                localStorage.removeItem('gm-grimoire-defenses');
                window.location.reload();
              }
            }}
            className="w-full py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg text-xs transition-colors"
          >
            🗑️ Очистить хранилище
          </button>
        </div>
      )}
      
      <div className="text-xs text-gray-500 border-t border-purple-700/30 pt-2">
        <p>Эта панель показывает сырые данные metadata токенов и локальное хранилище.</p>
        <p>Нажмите "Debug HP Bar" чтобы найти attachments токена для обновления HP bar.</p>
      </div>
    </div>
  );
}
