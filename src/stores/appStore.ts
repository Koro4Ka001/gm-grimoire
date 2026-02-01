import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  HistoryEvent, 
  SelectedToken, 
  CombinedUnit,
  DamageType,
} from '@/types';
import { useDefenseStore } from './defenseStore';

interface AppStore {
  // OBR State
  isObrReady: boolean;
  isGm: boolean;
  setObrReady: (ready: boolean) => void;
  setIsGm: (isGm: boolean) => void;
  
  // Selected Tokens (from OBR)
  selectedTokens: SelectedToken[];
  setSelectedTokens: (tokens: SelectedToken[]) => void;
  
  // History
  history: HistoryEvent[];
  addHistoryEvent: (event: Omit<HistoryEvent, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // UI State
  debugMode: boolean;
  toggleDebugMode: () => void;
  
  // Combined data getter
  getCombinedUnits: () => CombinedUnit[];
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // OBR State
      isObrReady: false,
      isGm: false,
      setObrReady: (ready) => set({ isObrReady: ready }),
      setIsGm: (isGm) => set({ isGm }),
      
      // Selected Tokens
      selectedTokens: [],
      setSelectedTokens: (tokens) => set({ selectedTokens: tokens }),
      
      // History
      history: [],
      
      addHistoryEvent: (event) => set((state) => ({
        history: [
          {
            ...event,
            id: uuidv4(),
            timestamp: Date.now(),
          },
          ...state.history,
        ].slice(0, 50), // Храним максимум 50 событий
      })),
      
      clearHistory: () => set({ history: [] }),
      
      // UI State
      debugMode: false,
      toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
      
      // Combined data getter
      getCombinedUnits: () => {
        const state = get();
        const defenseStore = useDefenseStore.getState();
        
        return state.selectedTokens.map((token): CombinedUnit => {
          const defense = defenseStore.getDefense(token.tokenId);
          const grimoire = token.grimoire;
          
          return {
            tokenId: token.tokenId,
            name: grimoire?.name || token.tokenName,
            image: token.image,
            
            // Grimoire data
            hp: grimoire?.hp ?? 0,
            maxHp: grimoire?.maxHp ?? 0,
            tempHp: grimoire?.tempHp ?? 0,
            mana: grimoire?.mana ?? null,
            maxMana: grimoire?.maxMana ?? null,
            
            // Defense data (local)
            flatArmor: defense?.flatArmor ?? 0,
            armorByType: defense?.armorByType ?? {},
            multipliers: defense?.multipliers ?? {},
            
            // Flags
            hasGrimoireData: grimoire !== null,
            hasDefenseData: defense !== null,
          };
        });
      },
    }),
    {
      name: 'gm-grimoire-app-storage',
      partialize: (state) => ({
        history: state.history.slice(0, 50),
        debugMode: state.debugMode,
      }),
    }
  )
);

// Вспомогательная функция для истории
export function createHistoryEvent(
  targetId: string,
  targetName: string,
  rawDamage: number,
  damageType: DamageType,
  finalDamage: number,
  overkill: number,
  hpBefore: number,
  hpAfter: number
): Omit<HistoryEvent, 'id' | 'timestamp'> {
  return {
    targetId,
    targetName,
    rawDamage,
    damageType,
    finalDamage,
    overkill,
    hpBefore,
    hpAfter,
  };
}
