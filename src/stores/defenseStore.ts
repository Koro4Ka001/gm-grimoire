import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DamageType, UnitDefense } from '@/types';

function createDefaultDefense(tokenId: string): UnitDefense {
  return {
    tokenId,
    flatArmor: 0,
    armorByType: {},
    multipliers: {},
    lastModified: Date.now(),
  };
}

interface DefenseStore {
  // Данные по токенам
  units: Record<string, UnitDefense>;
  
  // Actions
  getDefense: (tokenId: string) => UnitDefense | null;
  setDefense: (tokenId: string, defense: Partial<UnitDefense>) => void;
  
  setFlatArmor: (tokenId: string, value: number) => void;
  setArmorByType: (tokenId: string, type: DamageType, value: number) => void;
  removeArmorByType: (tokenId: string, type: DamageType) => void;
  
  setMultiplier: (tokenId: string, type: DamageType, value: number) => void;
  removeMultiplier: (tokenId: string, type: DamageType) => void;
  
  clearUnit: (tokenId: string) => void;
}

export const useDefenseStore = create<DefenseStore>()(
  persist(
    (set, get) => ({
      units: {},
      
      getDefense: (tokenId) => get().units[tokenId] || null,
      
      setDefense: (tokenId, defense) => set((state) => ({
        units: {
          ...state.units,
          [tokenId]: {
            ...createDefaultDefense(tokenId),
            ...state.units[tokenId],
            ...defense,
            tokenId,
            lastModified: Date.now(),
          },
        },
      })),
      
      setFlatArmor: (tokenId, value) => set((state) => {
        const current = state.units[tokenId] || createDefaultDefense(tokenId);
        return {
          units: {
            ...state.units,
            [tokenId]: { ...current, flatArmor: Math.max(0, value), lastModified: Date.now() },
          },
        };
      }),
      
      setArmorByType: (tokenId, type, value) => set((state) => {
        const current = state.units[tokenId] || createDefaultDefense(tokenId);
        return {
          units: {
            ...state.units,
            [tokenId]: {
              ...current,
              armorByType: { ...current.armorByType, [type]: Math.max(0, value) },
              lastModified: Date.now(),
            },
          },
        };
      }),
      
      removeArmorByType: (tokenId, type) => set((state) => {
        const current = state.units[tokenId];
        if (!current) return state;
        const { [type]: _, ...restArmor } = current.armorByType;
        return {
          units: {
            ...state.units,
            [tokenId]: {
              ...current,
              armorByType: restArmor,
              lastModified: Date.now(),
            },
          },
        };
      }),
      
      setMultiplier: (tokenId, type, value) => set((state) => {
        const current = state.units[tokenId] || createDefaultDefense(tokenId);
        const newMultipliers = { ...current.multipliers };
        
        // Если значение = 1 (нормально), удаляем запись
        if (value === 1) {
          delete newMultipliers[type];
        } else {
          newMultipliers[type] = value;
        }
        
        return {
          units: {
            ...state.units,
            [tokenId]: {
              ...current,
              multipliers: newMultipliers,
              lastModified: Date.now(),
            },
          },
        };
      }),
      
      removeMultiplier: (tokenId, type) => set((state) => {
        const current = state.units[tokenId];
        if (!current) return state;
        const { [type]: _, ...restMult } = current.multipliers;
        return {
          units: {
            ...state.units,
            [tokenId]: {
              ...current,
              multipliers: restMult,
              lastModified: Date.now(),
            },
          },
        };
      }),
      
      clearUnit: (tokenId) => set((state) => {
        const { [tokenId]: _, ...rest } = state.units;
        return { units: rest };
      }),
    }),
    {
      name: 'gm-grimoire-defenses',
    }
  )
);
