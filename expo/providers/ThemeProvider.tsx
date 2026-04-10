import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { DarkTheme, LightTheme, ThemeColors } from '@/constants/colors';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'zivo_theme_mode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const themeQuery = useQuery({
    queryKey: ['theme-mode'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      console.log('[Theme] Loaded mode:', stored);
      return (stored as ThemeMode) ?? 'dark';
    },
  });

  useEffect(() => {
    if (themeQuery.data) {
      setMode(themeQuery.data);
    }
  }, [themeQuery.data]);

  const toggleTheme = useCallback(() => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    console.log('[Theme] Switched to:', next);
  }, [mode]);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    console.log('[Theme] Set to:', newMode);
  }, []);

  const colors: ThemeColors = useMemo(() => {
    return mode === 'dark' ? DarkTheme : LightTheme;
  }, [mode]);

  const isDark = mode === 'dark';

  return useMemo(() => ({
    mode,
    isDark,
    colors,
    toggleTheme,
    setTheme,
  }), [mode, isDark, colors, toggleTheme, setTheme]);
});
