import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import { CardDetails, RoundUpSettings, SpendingCategory, SpendingCategoryType } from '@/types';

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

const SPENDING_CATEGORIES: { type: SpendingCategoryType; label: string; emoji: string }[] = [
  { type: 'food', label: 'Food & Dining', emoji: '🍔' },
  { type: 'shopping', label: 'Shopping', emoji: '🛍' },
  { type: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { type: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
  { type: 'gaming', label: 'Gaming', emoji: '🎮' },
  { type: 'transport', label: 'Transport', emoji: '🚗' },
  { type: 'other', label: 'Other', emoji: '📦' },
];

const DEFAULT_SETTINGS: CardSettings = {
  colorTheme: 'default',
  pattern: 'none',
  isLocked: false,
};

const DEFAULT_CARD_DETAILS: CardDetails = {
  cardNumber: '4532-XXXX-XXXX-4289',
  last4: '4289',
  cvv: '***',
  expiryMonth: '12',
  expiryYear: '28',
  cardholderName: 'USER',
  addedToWallet: false,
};

const DEFAULT_ROUND_UP: RoundUpSettings = {
  enabled: false,
  destination: 'savings',
  totalRounded: 0,
};

function getStorageKey(userId: string): string {
  return `zivo_card_${userId}`;
}

function getCardDetailsKey(userId: string): string {
  return `zivo_card_details_${userId}`;
}

function getRoundUpKey(userId: string): string {
  return `zivo_roundup_${userId}`;
}

function getCategoriesKey(userId: string): string {
  return `zivo_categories_${userId}`;
}

function generateCardNumber(): string {
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10));
  const formatted = digits.map((d, i) => (i > 0 && i % 4 === 0 ? `-${d}` : `${d}`)).join('');
  return formatted;
}

function generateLast4(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateCVV(): string {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateExpiry(): { month: string; year: string } {
  const now = new Date();
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const year = String(now.getFullYear() + 3 + Math.floor(Math.random() * 3)).slice(2);
  return { month, year };
}

export { CARD_THEMES, SPENDING_CATEGORIES };

export const [CardProvider, useCard] = createContextHook(() => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CardSettings>(DEFAULT_SETTINGS);
  const [cardDetails, setCardDetails] = useState<CardDetails>(DEFAULT_CARD_DETAILS);
  const [roundUp, setRoundUp] = useState<RoundUpSettings>(DEFAULT_ROUND_UP);
  const [categories, setCategories] = useState<SpendingCategory[]>([]);
  const userId = user?.id ?? null;

  const cardQuery = useQuery({
    queryKey: ['card-settings', userId],
    queryFn: async () => {
      if (!userId) return DEFAULT_SETTINGS;
      const stored = await AsyncStorage.getItem(getStorageKey(userId));
      if (stored) return JSON.parse(stored) as CardSettings;
      return DEFAULT_SETTINGS;
    },
    enabled: !!userId,
  });

  const cardDetailsQuery = useQuery({
    queryKey: ['card-details', userId],
    queryFn: async () => {
      if (!userId) return DEFAULT_CARD_DETAILS;
      const stored = await AsyncStorage.getItem(getCardDetailsKey(userId));
      if (stored) {
        const parsed = JSON.parse(stored) as CardDetails;
        return { ...parsed, cardholderName: user?.name?.toUpperCase() ?? 'USER' };
      }
      return { ...DEFAULT_CARD_DETAILS, cardholderName: user?.name?.toUpperCase() ?? 'USER' };
    },
    enabled: !!userId,
  });

  const roundUpQuery = useQuery({
    queryKey: ['round-up', userId],
    queryFn: async () => {
      if (!userId) return DEFAULT_ROUND_UP;
      const stored = await AsyncStorage.getItem(getRoundUpKey(userId));
      if (stored) return JSON.parse(stored) as RoundUpSettings;
      return DEFAULT_ROUND_UP;
    },
    enabled: !!userId,
  });

  const categoriesQuery = useQuery({
    queryKey: ['spending-categories', userId],
    queryFn: async () => {
      if (!userId) return [];
      const stored = await AsyncStorage.getItem(getCategoriesKey(userId));
      if (stored) return JSON.parse(stored) as SpendingCategory[];
      return SPENDING_CATEGORIES.map(c => ({
        id: `cat-${c.type}`,
        type: c.type,
        label: c.label,
        emoji: c.emoji,
        monthlyBudget: 0,
        currentSpend: 0,
        isLocked: false,
        autoLock: false,
      }));
    },
    enabled: !!userId,
  });

  useEffect(() => { if (cardQuery.data) setSettings(cardQuery.data); }, [cardQuery.data]);
  useEffect(() => { if (cardDetailsQuery.data) setCardDetails(cardDetailsQuery.data); }, [cardDetailsQuery.data]);
  useEffect(() => { if (roundUpQuery.data) setRoundUp(roundUpQuery.data); }, [roundUpQuery.data]);
  useEffect(() => { if (categoriesQuery.data) setCategories(categoriesQuery.data); }, [categoriesQuery.data]);

  const syncSettings = useMutation({
    mutationFn: async (updated: CardSettings) => {
      if (!userId) return;
      await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    },
  });

  const syncCardDetails = useMutation({
    mutationFn: async (updated: CardDetails) => {
      if (!userId) return;
      await AsyncStorage.setItem(getCardDetailsKey(userId), JSON.stringify(updated));
    },
  });

  const syncRoundUp = useMutation({
    mutationFn: async (updated: RoundUpSettings) => {
      if (!userId) return;
      await AsyncStorage.setItem(getRoundUpKey(userId), JSON.stringify(updated));
    },
  });

  const syncCategories = useMutation({
    mutationFn: async (updated: SpendingCategory[]) => {
      if (!userId) return;
      await AsyncStorage.setItem(getCategoriesKey(userId), JSON.stringify(updated));
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
    return updated.isLocked;
  }, [settings, syncSettings]);

  const regenerateCard = useCallback(() => {
    const newNumber = generateCardNumber();
    const newLast4 = generateLast4();
    const newCVV = generateCVV();
    const newExpiry = generateExpiry();
    const updated: CardDetails = {
      ...cardDetails,
      cardNumber: newNumber,
      last4: newLast4,
      cvv: newCVV,
      expiryMonth: newExpiry.month,
      expiryYear: newExpiry.year,
    };
    setCardDetails(updated);
    syncCardDetails.mutate(updated);
    return updated;
  }, [cardDetails, syncCardDetails]);

  const toggleWallet = useCallback(() => {
    const updated = { ...cardDetails, addedToWallet: !cardDetails.addedToWallet };
    setCardDetails(updated);
    syncCardDetails.mutate(updated);
  }, [cardDetails, syncCardDetails]);

  const updateRoundUp = useCallback((updates: Partial<RoundUpSettings>) => {
    const updated = { ...roundUp, ...updates };
    setRoundUp(updated);
    syncRoundUp.mutate(updated);
  }, [roundUp, syncRoundUp]);

  const addRoundUpAmount = useCallback((amount: number) => {
    const updated = { ...roundUp, totalRounded: roundUp.totalRounded + amount };
    setRoundUp(updated);
    syncRoundUp.mutate(updated);
  }, [roundUp, syncRoundUp]);

  const updateCategory = useCallback((categoryId: string, updates: Partial<SpendingCategory>) => {
    const updated = categories.map(c => {
      if (c.id !== categoryId) return c;
      const merged = { ...c, ...updates };
      if (merged.autoLock && merged.currentSpend >= merged.monthlyBudget && merged.monthlyBudget > 0 && !merged.isLocked) {
        merged.isLocked = true;
        merged.lockedAt = new Date().toISOString();
      }
      return merged;
    });
    setCategories(updated);
    syncCategories.mutate(updated);
  }, [categories, syncCategories]);

  const toggleCategoryLock = useCallback((categoryId: string) => {
    const updated = categories.map(c => {
      if (c.id !== categoryId) return c;
      return { ...c, isLocked: !c.isLocked, lockedAt: !c.isLocked ? new Date().toISOString() : undefined };
    });
    setCategories(updated);
    syncCategories.mutate(updated);
  }, [categories, syncCategories]);

  const addSpending = useCallback((categoryType: SpendingCategoryType, amount: number) => {
    const updated = categories.map(c => {
      if (c.type !== categoryType) return c;
      const newSpend = c.currentSpend + amount;
      const shouldLock = c.autoLock && c.monthlyBudget > 0 && newSpend >= c.monthlyBudget && !c.isLocked;
      return {
        ...c,
        currentSpend: newSpend,
        isLocked: shouldLock ? true : c.isLocked,
        lockedAt: shouldLock ? new Date().toISOString() : c.lockedAt,
      };
    });
    setCategories(updated);
    syncCategories.mutate(updated);
  }, [categories, syncCategories]);

  const resetMonthlySpending = useCallback(() => {
    const updated = categories.map(c => ({
      ...c,
      currentSpend: 0,
      isLocked: false,
      lockedAt: undefined,
    }));
    setCategories(updated);
    syncCategories.mutate(updated);
  }, [categories, syncCategories]);

  const currentTheme = useMemo(() => {
    return CARD_THEMES.find(t => t.id === settings.colorTheme) ?? CARD_THEMES[0];
  }, [settings.colorTheme]);

  return useMemo(() => ({
    settings,
    currentTheme,
    cardDetails,
    roundUp,
    categories,
    updateCardTheme,
    updateCardPattern,
    toggleCardLock,
    regenerateCard,
    toggleWallet,
    updateRoundUp,
    addRoundUpAmount,
    updateCategory,
    toggleCategoryLock,
    addSpending,
    resetMonthlySpending,
    isLocked: settings.isLocked,
  }), [settings, currentTheme, cardDetails, roundUp, categories, updateCardTheme, updateCardPattern, toggleCardLock, regenerateCard, toggleWallet, updateRoundUp, addRoundUpAmount, updateCategory, toggleCategoryLock, addSpending, resetMonthlySpending]);
});
