import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';

export interface SecuritySettings {
  pinEnabled: boolean;
  pinCode: string | null;
  biometricEnabled: boolean;
  passwordLockEnabled: boolean;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  pinEnabled: false,
  pinCode: null,
  biometricEnabled: false,
  passwordLockEnabled: false,
};

function getStorageKey(userId: string): string {
  return `zivo_security_${userId}`;
}

export const [SecurityProvider, useSecurity] = createContextHook(() => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [isLocked, setIsLocked] = useState(false);
  const userId = user?.id ?? null;

  const securityQuery = useQuery({
    queryKey: ['security-settings', userId],
    queryFn: async () => {
      if (!userId) return DEFAULT_SETTINGS;
      const stored = await AsyncStorage.getItem(getStorageKey(userId));
      if (stored) {
        return JSON.parse(stored) as SecuritySettings;
      }
      return DEFAULT_SETTINGS;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (securityQuery.data) {
      setSettings(securityQuery.data);
    }
  }, [securityQuery.data]);

  const syncSettings = useMutation({
    mutationFn: async (updated: SecuritySettings) => {
      if (!userId) return;
      await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
      console.log('[Security] Settings saved');
    },
  });

  const enablePin = useCallback((pin: string) => {
    const updated = { ...settings, pinEnabled: true, pinCode: pin };
    setSettings(updated);
    syncSettings.mutate(updated);
    console.log('[Security] PIN enabled');
  }, [settings, syncSettings]);

  const disablePin = useCallback(() => {
    const updated = { ...settings, pinEnabled: false, pinCode: null };
    setSettings(updated);
    syncSettings.mutate(updated);
    console.log('[Security] PIN disabled');
  }, [settings, syncSettings]);

  const verifyPin = useCallback((pin: string): boolean => {
    return settings.pinCode === pin;
  }, [settings.pinCode]);

  const toggleBiometric = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('[Security] Biometric not available on web');
      return false;
    }
    try {
      const LocalAuth = await import('expo-local-authentication');
      const hasHardware = await LocalAuth.hasHardwareAsync();
      const isEnrolled = await LocalAuth.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        console.log('[Security] Biometric not available');
        return false;
      }

      const newValue = !settings.biometricEnabled;
      if (newValue) {
        const result = await LocalAuth.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          fallbackLabel: 'Use PIN',
        });
        if (!result.success) return false;
      }

      const updated = { ...settings, biometricEnabled: newValue };
      setSettings(updated);
      syncSettings.mutate(updated);
      console.log('[Security] Biometric:', newValue);
      return true;
    } catch (error) {
      console.log('[Security] Biometric error:', error);
      return false;
    }
  }, [settings, syncSettings]);

  const authenticateBiometric = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    try {
      const LocalAuth = await import('expo-local-authentication');
      const result = await LocalAuth.authenticateAsync({
        promptMessage: 'Authenticate to access Zivo',
        fallbackLabel: 'Use PIN',
      });
      return result.success;
    } catch {
      return false;
    }
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  const lock = useCallback(() => {
    if (settings.pinEnabled || settings.biometricEnabled) {
      setIsLocked(true);
    }
  }, [settings.pinEnabled, settings.biometricEnabled]);

  return useMemo(() => ({
    settings,
    isLocked,
    enablePin,
    disablePin,
    verifyPin,
    toggleBiometric,
    authenticateBiometric,
    unlock,
    lock,
  }), [settings, isLocked, enablePin, disablePin, verifyPin, toggleBiometric, authenticateBiometric, unlock, lock]);
});
