import { useEffect, useState, useCallback } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { SelectedToken, CombinedUnit } from '@/types';
import { parseGrimoireData } from '@/utils/grimoireParser';
import { useDefenseStore } from '@/stores/defenseStore';

export function useOBR() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<SelectedToken[]>([]);
  const getDefense = useDefenseStore(s => s.getDefense);

  // Загрузка данных выделенных токенов
  const loadSelectedTokens = useCallback(async () => {
    if (!isReady) return;
    
    setIsLoading(true);
    try {
      const selection = await OBR.player.getSelection();
      
      if (!selection || selection.length === 0) {
        setSelectedTokens([]);
        return;
      }
      
      const items = await OBR.scene.items.getItems(selection);
      
      const tokens: SelectedToken[] = items
        .filter(item => item.type === 'IMAGE')
        .map(item => {
          const grimoire = parseGrimoireData(item.metadata);
          return {
            tokenId: item.id,
            tokenName: item.name || 'Безымянный',
            grimoire,
            image: (item as any).image?.url,
            position: item.position,
          };
        });
      
      setSelectedTokens(tokens);
    } catch (error) {
      console.error('[useOBR] Error loading tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    let mounted = true;

    OBR.onReady(async () => {
      console.log('[useOBR] OBR Ready');
      if (mounted) {
        setIsReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Загружаем при готовности и подписываемся на изменения
  useEffect(() => {
    if (!isReady) return;

    // Первичная загрузка
    loadSelectedTokens();

    // Подписка на изменение выделения
    const unsubPlayer = OBR.player.onChange(() => {
      loadSelectedTokens();
    });

    // Подписка на изменение элементов (для обновления HP в реалтайме)
    const unsubItems = OBR.scene.items.onChange((items) => {
      // Обновляем только если изменились выделенные токены
      setSelectedTokens(prev => {
        const updated = prev.map(token => {
          const item = items.find(i => i.id === token.tokenId);
          if (item) {
            const grimoire = parseGrimoireData(item.metadata);
            return {
              ...token,
              tokenName: item.name || token.tokenName,
              grimoire,
            };
          }
          return token;
        });
        return updated;
      });
    });

    return () => {
      unsubPlayer();
      unsubItems();
    };
  }, [isReady, loadSelectedTokens]);

  // Комбинируем данные Grimoire с локальными защитами
  const selectedUnits: CombinedUnit[] = selectedTokens.map(token => {
    const defense = getDefense(token.tokenId);
    const grimoire = token.grimoire;
    
    return {
      tokenId: token.tokenId,
      name: grimoire?.name || token.tokenName,
      image: token.image,
      
      // Данные из Grimoire
      hp: grimoire?.hp ?? 0,
      maxHp: grimoire?.maxHp ?? 0,
      tempHp: grimoire?.tempHp ?? 0,
      mana: grimoire?.mana ?? null,
      maxMana: grimoire?.maxMana ?? null,
      
      // Защита
      flatArmor: defense?.flatArmor ?? grimoire?.armor ?? 0,
      armorByType: defense?.armorByType ?? {},
      multipliers: defense?.multipliers ?? {},
      
      // Флаги
      hasGrimoireData: grimoire !== null,
      hasDefenseData: defense !== null,
    };
  });

  return {
    isReady,
    isLoading,
    selectedTokens,
    selectedUnits,
    refreshTokens: loadSelectedTokens,
  };
}
