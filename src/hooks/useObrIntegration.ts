import { useEffect, useCallback } from 'react';
import OBR, { Item } from '@owlbear-rodeo/sdk';
import { useAppStore } from '@/stores/appStore';
import { parseGrimoireData } from '@/utils/grimoireParser';
import { SelectedToken } from '@/types';

// Утилита для проверки OBR окружения (для будущего использования)
// const isInsideOBR = (): boolean => {
//   try { return window.self !== window.top; } catch { return true; }
// };

/**
 * Хук для интеграции с Owlbear Rodeo SDK
 */
export function useObrIntegration() {
  const { 
    setObrReady, 
    setIsGm, 
    setSelectedTokens,
    isObrReady,
  } = useAppStore();
  
  // Обработка выделенных токенов
  const processSelectedItems = useCallback(async (selection: string[] | undefined) => {
    if (!selection || selection.length === 0) {
      setSelectedTokens([]);
      return;
    }
    
    try {
      const items = await OBR.scene.items.getItems(selection);
      
      const tokens: SelectedToken[] = items
        .filter((item): item is Item & { type: 'IMAGE' } => item.type === 'IMAGE')
        .map((item) => {
          const metadata = item.metadata as Record<string, unknown>;
          const grimoireData = parseGrimoireData(metadata);
          
          return {
            tokenId: item.id,
            tokenName: item.name || 'Безымянный',
            grimoire: grimoireData,
            image: (item as unknown as { image?: { url?: string } }).image?.url,
            position: item.position,
          };
        });
      
      setSelectedTokens(tokens);
    } catch (error) {
      console.error('[OBR Integration] Error processing selection:', error);
    }
  }, [setSelectedTokens]);
  
  // Инициализация OBR SDK
  useEffect(() => {
    let mounted = true;
    
    const initOBR = async () => {
      try {
        // Ожидаем готовности OBR
        await OBR.onReady(async () => {
          if (!mounted) return;
          
          console.log('[OBR Integration] OBR is ready');
          setObrReady(true);
          
          // Получаем роль игрока
          const role = await OBR.player.getRole();
          setIsGm(role === 'GM');
          
          // Получаем начальное выделение
          const initialSelection = await OBR.player.getSelection();
          await processSelectedItems(initialSelection);
        });
      } catch (error) {
        console.error('[OBR Integration] Failed to initialize:', error);
      }
    };
    
    initOBR();
    
    return () => {
      mounted = false;
    };
  }, [setObrReady, setIsGm, processSelectedItems]);
  
  // Подписка на изменения выделения
  useEffect(() => {
    if (!isObrReady) return;
    
    const unsubscribe = OBR.player.onChange(async (player) => {
      await processSelectedItems(player.selection);
    });
    
    return () => {
      unsubscribe();
    };
  }, [isObrReady, processSelectedItems]);
  
  // Подписка на изменения элементов сцены (для real-time обновления HP)
  useEffect(() => {
    if (!isObrReady) return;
    
    const unsubscribe = OBR.scene.items.onChange(async (items) => {
      // Получаем текущее выделение
      const selection = await OBR.player.getSelection();
      if (!selection || selection.length === 0) return;
      
      // Проверяем, изменились ли выделенные токены
      const selectedItems = items.filter(item => selection.includes(item.id));
      if (selectedItems.length === 0) return;
      
      // Обновляем данные выделенных токенов
      const tokens: SelectedToken[] = selectedItems
        .filter((item): item is Item & { type: 'IMAGE' } => item.type === 'IMAGE')
        .map((item) => {
          const metadata = item.metadata as Record<string, unknown>;
          const grimoireData = parseGrimoireData(metadata);
          
          return {
            tokenId: item.id,
            tokenName: item.name || 'Безымянный',
            grimoire: grimoireData,
            image: (item as unknown as { image?: { url?: string } }).image?.url,
            position: item.position,
          };
        });
      
      if (tokens.length > 0) {
        useAppStore.getState().setSelectedTokens(tokens);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [isObrReady]);
  
  return { isObrReady };
}

/**
 * Хук для получения raw metadata выделенных токенов (для дебага)
 */
export function useDebugMetadata() {
  const { selectedTokens, isObrReady } = useAppStore();
  
  const getTokenMetadata = useCallback(async (tokenId: string): Promise<Record<string, unknown> | null> => {
    if (!isObrReady) return null;
    
    try {
      const items = await OBR.scene.items.getItems([tokenId]);
      if (items.length === 0) return null;
      return items[0].metadata as Record<string, unknown>;
    } catch (error) {
      console.error('[Debug] Error getting metadata:', error);
      return null;
    }
  }, [isObrReady]);
  
  return { getTokenMetadata, selectedTokens };
}
