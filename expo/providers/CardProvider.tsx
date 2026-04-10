import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';

export interface CardSettings {
  colorTheme: string;
  pattern: 'none' | 'dots' | 'lines' | 'gradient' | 'mesh';
  isLocked: boolean;
}

const CARD_THEMES = [
  { id: 'default', primary: '#0D1117', accent: 'rgba(0, 230, 118, 0.15)', label: 'Stealth' },
  { id: 'midnight', primary: '#0F172A', accent: 'rgba(59, 130, 246, 0.15)', label: 'Midnight' },
  { id: 'ember', primary: '#1C1014', accent: 'rgba(239, 68, 68, 0.15)', label: 'Ember' },
  { id: 'royal', primary: '#14101C', accent: 'rgba(168, 85, 247, 0.15)', label: 'Royal' },
  { id: 'ocean', primary: '#0C1518', accent: 'rgba(20, 184, 166, 0.15)', label: 'Ocean' },
  { id: 'gold', primary: '#1A1608', accent: 'rgba(245, 158, 11, 0.15)', label: 'Gold' },
];

const DEFAULT_SETTINGS: CardSettings = {
  colorTheme: 'default',
  pattern: 'none',
  isLocked: false,
};

function getStorageKey(userId: string): string {
  return `zivo_card_${userId}`;
}

export { CARD_THEMES };

export const [CardProvider, useCard] = createContextHook(() => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CardSettings>(DEFAULT_SETTINGS);
  const userId = user?.id ?? null;

  const cardQuery = useQuery({
    queryKey: ['card-settings', userId],
    queryFn: async () => {
      if (!userId) return DEFAULT_SETTINGS;
      const stored = await AsyncStorage.getItem(getStorageKey(userId));
      if (stored) {
        return JSON.parse(stored) as CardSettings;
      }
      return DEFAULT_SETTINGS;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (cardQuery.data) {
      setSettings(cardQuery.data);
    }
  }, [cardQuery.data]);

  const syncSettings = useMutation({
    mutationFn: async (updated: CardSettings) => {
      if (!userId) return;
      await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
      console.log('[Card] Settings saved');
    },
  });

  const updateCardTheme = useCallback((colorTheme: string) => {
    const updated = { ...settings, colorTheme };
    setSettings(updated);
    syncSettings.mutate(updated);
  }, [settings, syncSettings]);

  const updateCardPattern = useCallback((pattern: CardSettings['pattern']) => {
    const updated = { ...settings, pattern };
    setSettings(updated);
    syncSettings.mutate(updated);
  }, [settings, syncSettings]);

  const toggleCardLock = useCallback(() => {
    const updated = { ...settings, isLocked: !settings.isLocked };
    setSettings(updated);
    syncSettings.mutate(updated);
    console.log('[Card] Lock toggled:', updated.isLocked);
    return updated.isLocked;
  }, [settings, syncSettings]);

  const currentTheme = useMemo(() => {
    return CARD_THEMES.find(t => t.id === settings.colorTheme) ?? CARD_THEMES[0];
  }, [settings.colorTheme]);

  return useMemo(() => ({
    settings,
    currentTheme,
    updateCardTheme,
    updateCardPattern,
    toggleCardLock,
    isLocked: settings.isLocked,
  }), [settings, currentTheme, updateCardTheme, updateCardPattern, toggleCardLock]);
});
