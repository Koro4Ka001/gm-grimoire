import { useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';

export function useIsGM() {
  const [isGM, setIsGM] = useState<boolean | null>(null); // null = загрузка

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      try {
        // Проверяем, инициализирован ли OBR
        const isReady = await OBR.isReady;
        if (!isReady) {
          console.log('[useIsGM] OBR not ready');
          if (mounted) setIsGM(false);
          return;
        }

        const role = await OBR.player.getRole();
        console.log('[useIsGM] Player role:', role);
        if (mounted) {
          setIsGM(role === 'GM');
        }
      } catch (error) {
        console.error('[useIsGM] Failed to get player role:', error);
        if (mounted) {
          setIsGM(false);
        }
      }
    }

    // Ждём готовности OBR
    OBR.onReady(() => {
      checkRole();

      // Подписка на изменение роли
      const unsubscribe = OBR.player.onChange((player) => {
        console.log('[useIsGM] Player changed, role:', player.role);
        if (mounted) {
          setIsGM(player.role === 'GM');
        }
      });

      return () => {
        unsubscribe();
      };
    });

    return () => {
      mounted = false;
    };
  }, []);

  return isGM;
}
