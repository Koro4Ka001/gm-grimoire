import OBR from '@owlbear-rodeo/sdk';
import { detectGrimoirePrefix, findHpKey, findTempHpKey } from './grimoireParser';

export interface HpUpdate {
  tokenId: string;
  newHp: number;
  newTempHp?: number;
}

/**
 * Обновляет HP токена в OBR metadata
 */
export async function updateTokenHp(
  tokenId: string,
  newHp: number,
  newTempHp?: number
): Promise<boolean> {
  try {
    const items = await OBR.scene.items.getItems([tokenId]);
    if (items.length === 0) {
      console.error('[Writer] Token not found:', tokenId);
      return false;
    }
    
    const token = items[0];
    const metadata = token.metadata as Record<string, unknown>;
    const prefix = detectGrimoirePrefix(metadata);
    
    if (!prefix) {
      console.error('[Writer] No Grimoire prefix found for token:', tokenId);
      return false;
    }
    
    await OBR.scene.items.updateItems([tokenId], (itemsToUpdate) => {
      for (const item of itemsToUpdate) {
        const itemMeta = item.metadata as Record<string, unknown>;
        
        // Проверяем, вложенная ли это структура
        if (prefix in itemMeta && typeof itemMeta[prefix] === 'object') {
          // Вложенная структура
          const nested = itemMeta[prefix] as Record<string, unknown>;
          if ('hp' in nested) {
            nested.hp = Math.max(0, newHp);
          } else if ('currentHp' in nested) {
            nested.currentHp = Math.max(0, newHp);
          }
          
          if (newTempHp !== undefined) {
            if ('tempHp' in nested) {
              nested.tempHp = Math.max(0, newTempHp);
            } else {
              nested.tempHp = Math.max(0, newTempHp);
            }
          }
        } else {
          // Плоская структура
          const hpKey = findHpKey(itemMeta, prefix);
          if (hpKey) {
            itemMeta[hpKey] = Math.max(0, newHp);
          }
          
          if (newTempHp !== undefined) {
            const tempKey = findTempHpKey(itemMeta, prefix);
            if (tempKey) {
              itemMeta[tempKey] = Math.max(0, newTempHp);
            } else {
              // Создаём ключ если его нет
              itemMeta[`${prefix}/tempHp`] = Math.max(0, newTempHp);
            }
          }
        }
      }
    });
    
    // Пробуем также обновить HP bar attachment
    await updateTokenHealthBar(tokenId, newHp, items[0].metadata as Record<string, unknown>);
    
    console.log('[Writer] Successfully updated HP for token:', tokenId);
    return true;
  } catch (error) {
    console.error('[Writer] Error updating HP:', error);
    return false;
  }
}

/**
 * Массовое обновление HP нескольких токенов
 */
export async function updateMultipleTokensHp(
  updates: HpUpdate[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const tokenIds = updates.map(u => u.tokenId);
  const errors: string[] = [];
  let success = 0;
  let failed = 0;
  
  try {
    const items = await OBR.scene.items.getItems(tokenIds);
    const itemMap = new Map(items.map(i => [i.id, i]));
    
    // Валидируем что все токены существуют и имеют Grimoire данные
    const validUpdates: HpUpdate[] = [];
    for (const update of updates) {
      const item = itemMap.get(update.tokenId);
      if (!item) {
        errors.push(`Token not found: ${update.tokenId}`);
        failed++;
        continue;
      }
      
      const prefix = detectGrimoirePrefix(item.metadata as Record<string, unknown>);
      if (!prefix) {
        errors.push(`No Grimoire data: ${item.name || update.tokenId}`);
        failed++;
        continue;
      }
      
      validUpdates.push(update);
    }
    
    if (validUpdates.length === 0) {
      return { success: 0, failed, errors };
    }
    
    // Обновляем валидные токены
    await OBR.scene.items.updateItems(
      validUpdates.map(u => u.tokenId),
      (itemsToUpdate) => {
        for (const item of itemsToUpdate) {
          const update = validUpdates.find(u => u.tokenId === item.id);
          if (!update) continue;
          
          const itemMeta = item.metadata as Record<string, unknown>;
          const prefix = detectGrimoirePrefix(itemMeta);
          if (!prefix) continue;
          
          // Проверяем тип структуры
          if (prefix in itemMeta && typeof itemMeta[prefix] === 'object') {
            // Вложенная
            const nested = itemMeta[prefix] as Record<string, unknown>;
            if ('hp' in nested) {
              nested.hp = Math.max(0, update.newHp);
            } else if ('currentHp' in nested) {
              nested.currentHp = Math.max(0, update.newHp);
            }
            
            if (update.newTempHp !== undefined) {
              nested.tempHp = Math.max(0, update.newTempHp);
            }
          } else {
            // Плоская
            const hpKey = findHpKey(itemMeta, prefix);
            if (hpKey) {
              itemMeta[hpKey] = Math.max(0, update.newHp);
            }
            
            if (update.newTempHp !== undefined) {
              const tempKey = findTempHpKey(itemMeta, prefix);
              if (tempKey) {
                itemMeta[tempKey] = Math.max(0, update.newTempHp);
              } else {
                itemMeta[`${prefix}/tempHp`] = Math.max(0, update.newTempHp);
              }
            }
          }
          
          success++;
        }
      }
    );
    
    console.log(`[Writer] Batch update complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  } catch (error) {
    console.error('[Writer] Batch update error:', error);
    return { success: 0, failed: updates.length, errors: [String(error)] };
  }
}

/**
 * Попытка обновить HP bar attachment (если есть)
 * HP bar создаётся GM Grimoire как отдельный элемент привязанный к токену
 */
async function updateTokenHealthBar(
  tokenId: string,
  newHp: number,
  tokenMetadata: Record<string, unknown>
): Promise<boolean> {
  try {
    // Получаем maxHp из metadata
    const prefix = detectGrimoirePrefix(tokenMetadata);
    if (!prefix) return false;
    
    let maxHp = 0;
    
    if (prefix in tokenMetadata && typeof tokenMetadata[prefix] === 'object') {
      const nested = tokenMetadata[prefix] as Record<string, unknown>;
      maxHp = Number(nested.maxHp ?? nested['max-hp'] ?? nested.hpMax ?? newHp);
    } else {
      const maxHpKey = `${prefix}/maxHp`;
      maxHp = Number(tokenMetadata[maxHpKey] ?? tokenMetadata[`${prefix}/max-hp`] ?? newHp);
    }
    
    if (maxHp === 0) return false;
    
    // Получаем все элементы чтобы найти HP bar
    const allItems = await OBR.scene.items.getItems();
    
    // Ищем HP bar привязанный к нашему токену
    const healthBarItems = allItems.filter(item => 
      item.attachedTo === tokenId && 
      (
        // Возможные способы как Grimoire помечает HP bar
        (item.metadata as Record<string, unknown>)?.['com.battle-system.gmg/isHealthBar'] === true ||
        (item.metadata as Record<string, unknown>)?.['isHealthBar'] === true ||
        item.name?.toLowerCase().includes('health') ||
        item.name?.toLowerCase().includes('hp') ||
        item.type === 'SHAPE'
      )
    );
    
    if (healthBarItems.length === 0) {
      return false;
    }
    
    const hpPercent = Math.max(0, Math.min(1, newHp / maxHp));
    
    // Обновляем найденные HP bars
    await OBR.scene.items.updateItems(
      healthBarItems.map(i => i.id),
      (items) => {
        for (const item of items) {
          // Пробуем разные способы обновить ширину/scale
          const itemAny = item as Record<string, unknown>;
          
          // Способ 1: Scale
          if ('scale' in item) {
            itemAny.scale = { x: hpPercent, y: 1 };
          }
          
          // Обновляем metadata
          if (item.metadata) {
            const meta = item.metadata as Record<string, unknown>;
            meta['healthPercent'] = hpPercent;
            meta['currentHp'] = newHp;
            meta['maxHp'] = maxHp;
          }
        }
      }
    );
    
    console.log('[HP Bar] Updated successfully');
    return true;
  } catch (error) {
    console.log('[HP Bar] Could not update (this is normal if Grimoire manages HP bar itself):', error);
    return false;
  }
}

/**
 * Debug функция для просмотра attachments токена
 */
export async function debugTokenAttachments(tokenId: string) {
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
  
  return attachments;
}
