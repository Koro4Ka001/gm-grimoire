import OBR from '@owlbear-rodeo/sdk';

const HP_TRACKER_KEY = 'com.bitperfect-software.hp-tracker/data';
const HP_BAR_MAX_WIDTH = 146;

export async function updateTokenHp(
  tokenId: string,
  newHp: number,
  maxHpParam?: number
): Promise<boolean> {
  try {
    // 1. Получаем все элементы
    const allItems = await OBR.scene.items.getItems();
    
    // 2. Находим токен
    const token = allItems.find(item => item.id === tokenId);
    if (!token) {
      console.error('[HP Update] Token not found:', tokenId);
      return false;
    }
    
    // 3. Получаем текущие данные HP из metadata
    const metadata = token.metadata as Record<string, any>;
    const hpData = metadata[HP_TRACKER_KEY];
    
    if (!hpData) {
      console.error('[HP Update] No HP Tracker data on token');
      return false;
    }
    
    // 4. Берём maxHp из metadata (или из параметра если передан)
    const maxHp = maxHpParam ?? hpData.maxHp ?? hpData.hp ?? 100;
    const safeNewHp = Math.max(0, Math.min(newHp, maxHp));
    
    console.log(`[HP Update] Token ${tokenId}: ${safeNewHp}/${maxHp}`);
    
    // 5. Обновляем HP в metadata токена
    await OBR.scene.items.updateItems([tokenId], (items) => {
      for (const item of items) {
        const meta = item.metadata as Record<string, any>;
        if (meta[HP_TRACKER_KEY]) {
          meta[HP_TRACKER_KEY].hp = safeNewHp;
        }
      }
    });
    
    // 6. Вычисляем процент HP
    const hpPercent = maxHp > 0 ? safeNewHp / maxHp : 0;
    const newBarWidth = Math.round(HP_BAR_MAX_WIDTH * hpPercent);
    
    console.log(`[HP Update] Percent: ${(hpPercent * 100).toFixed(1)}%, Bar width: ${newBarWidth}px`);
    
    // 7. Находим attachments
    const attachments = allItems.filter(item => item.attachedTo === tokenId);
    
    // 8. Обновляем HP bar (name="hp")
    const hpBar = attachments.find(a => a.name === 'hp' && a.type === 'SHAPE');
    if (hpBar) {
      await OBR.scene.items.updateItems([hpBar.id], (items) => {
        for (const item of items) {
          (item as any).width = newBarWidth;
        }
      });
      console.log('[HP Update] HP bar updated');
    } else {
      console.log('[HP Update] HP bar not found');
    }
    
    // 9. Обновляем HP text (name="hp-text")
    const hpText = attachments.find(a => a.name === 'hp-text' && a.type === 'TEXT');
    if (hpText) {
      await OBR.scene.items.updateItems([hpText.id], (items) => {
        for (const item of items) {
          const textItem = item as any;
          if (textItem.text) {
            textItem.text.plainText = `${safeNewHp}/${maxHp}`;
          }
        }
      });
      console.log('[HP Update] HP text updated');
    } else {
      console.log('[HP Update] HP text not found');
    }
    
    console.log('[HP Update] Completed successfully');
    return true;
    
  } catch (error) {
    console.error('[HP Update] Error:', error);
    return false;
  }
}

// Массовое обновление HP
export async function updateMultipleTokensHp(
  updates: Array<{ tokenId: string; newHp: number; maxHp?: number }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  for (const update of updates) {
    const result = await updateTokenHp(update.tokenId, update.newHp, update.maxHp);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
}
