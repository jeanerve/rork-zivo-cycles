import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { UserProfile, PaymentMethod, AccountType } from '@/types';
import { MOCK_BADGES } from '@/mocks/data';

const AUTH_SESSION_KEY = 'zivo_current_session';
function userStorageKey(email: string): string {
  return `zivo_user_${email.toLowerCase().trim()}`;
}

interface StoredSession {
  isAuthenticated: boolean;
  email: string | null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const authQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      console.log('[Auth] Loading session...');
      const sessionRaw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!sessionRaw) {
        console.log('[Auth] No session found');
        return { isAuthenticated: false, user: null };
      }
      const session = JSON.parse(sessionRaw) as StoredSession;
      if (!session.isAuthenticated || !session.email) {
        console.log('[Auth] Session not authenticated');
        return { isAuthenticated: false, user: null };
      }
      const userRaw = await AsyncStorage.getItem(userStorageKey(session.email));
      if (!userRaw) {
        console.log('[Auth] No user data for email:', session.email);
        return { isAuthenticated: false, user: null };
      }
      const userData = JSON.parse(userRaw) as UserProfile;
      console.log('[Auth] Loaded user:', userData.name, userData.email);
      return { isAuthenticated: true, user: userData };
    },
  });

  useEffect(() => {
    if (authQuery.data) {
      setIsAuthenticated(authQuery.data.isAuthenticated);
      setUser(authQuery.data.user);
      setIsReady(true);
    }
  }, [authQuery.data]);

  const saveSession = useMutation({
    mutationFn: async (data: { email: string | null; isAuthenticated: boolean }) => {
      const session: StoredSession = { isAuthenticated: data.isAuthenticated, email: data.email };
      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    },
  });

  const saveUserData = useMutation({
    mutationFn: async (userData: UserProfile) => {
      await AsyncStorage.setItem(userStorageKey(userData.email), JSON.stringify(userData));
      console.log('[Auth] Saved user data for:', userData.email);
    },
  });

  const signUp = useCallback((params: {
    name: string;
    email: string;
    password: string;
    dateOfBirth?: string;
    accountType?: AccountType;
  }) => {
    const email = params.email.toLowerCase().trim();
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newUser: UserProfile = {
      id: userId,
      name: params.name,
      email,
      avatar: '',
      totalSaved: 0,
      activeCycles: 0,
      completedCycles: 0,
      streak: 0,
      disciplineScore: 0,
      badges: MOCK_BADGES.map(b => ({ ...b, earned: false, earnedDate: undefined })),
      joinDate: new Date().toISOString(),
      dateOfBirth: params.dateOfBirth,
      accountType: params.accountType ?? 'adult',
      parentApprovalStatus: params.accountType === 'teen' ? 'none' : undefined,
      paymentMethods: [],
    };

    console.log('[Auth] New signup:', email, 'userId:', userId, 'accountType:', params.accountType);
    setUser(newUser);
    setIsAuthenticated(true);
    saveUserData.mutate(newUser);
    saveSession.mutate({ email, isAuthenticated: true });
    return newUser;
  }, [saveUserData, saveSession]);

  const logIn = useCallback(async (params: { email: string; password: string }) => {
    const email = params.email.toLowerCase().trim();
    console.log('[Auth] Login attempt for:', email);

    const existingRaw = await AsyncStorage.getItem(userStorageKey(email));
    let userData: UserProfile;

    if (existingRaw) {
      userData = JSON.parse(existingRaw) as UserProfile;
      console.log('[Auth] Found existing user:', userData.name);
    } else {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      userData = {
        id: userId,
        name: email.split('@')[0],
        email,
        avatar: '',
        totalSaved: 0,
        activeCycles: 0,
        completedCycles: 0,
        streak: 0,
        disciplineScore: 0,
        badges: MOCK_BADGES.map(b => ({ ...b, earned: false, earnedDate: undefined })),
        joinDate: new Date().toISOString(),
        accountType: 'adult',
        paymentMethods: [],
      };
      console.log('[Auth] Created new user on login:', email);
      await AsyncStorage.setItem(userStorageKey(email), JSON.stringify(userData));
    }

    setUser(userData);
    setIsAuthenticated(true);
    saveSession.mutate({ email, isAuthenticated: true });
    return userData;
  }, [saveSession]);

  const logOut = useCallback(async () => {
    console.log('[Auth] Logging out, clearing session...');
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ isAuthenticated: false, email: null }));
    queryClient.clear();
    console.log('[Auth] Logout complete');
  }, [queryClient]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    saveUserData.mutate(updated);
  }, [user, saveUserData]);

  const updateAvatar = useCallback((avatarUri: string) => {
    if (!user) return;
    const updated = { ...user, avatar: avatarUri };
    setUser(updated);
    saveUserData.mutate(updated);
  }, [user, saveUserData]);

  const requestParentApproval = useCallback((parentEmail: string) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      parentEmail: parentEmail.toLowerCase().trim(),
      parentApprovalStatus: 'pending',
    };
    setUser(updated);
    saveUserData.mutate(updated);
    console.log('[Auth] Parent approval requested, email:', parentEmail);
  }, [user, saveUserData]);

  const approveTeenAccount = useCallback(() => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      parentApprovalStatus: 'approved',
    };
    setUser(updated);
    saveUserData.mutate(updated);
    console.log('[Auth] Teen account approved');
  }, [user, saveUserData]);

  const addPaymentMethod = useCallback((method: Omit<PaymentMethod, 'id' | 'addedAt'>) => {
    if (!user) return;
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    const methods = [...(user.paymentMethods ?? [])];
    if (newMethod.isDefault) {
      methods.forEach(m => { m.isDefault = false; });
    }
    methods.push(newMethod);
    const updated = { ...user, paymentMethods: methods };
    setUser(updated);
    saveUserData.mutate(updated);
    console.log('[Auth] Payment method added:', newMethod.type, newMethod.last4);
  }, [user, saveUserData]);

  const removePaymentMethod = useCallback((methodId: string) => {
    if (!user) return;
    const methods = (user.paymentMethods ?? []).filter(m => m.id !== methodId);
    const updated = { ...user, paymentMethods: methods };
    setUser(updated);
    saveUserData.mutate(updated);
  }, [user, saveUserData]);

  return useMemo(() => ({
    isAuthenticated,
    isReady,
    user,
    signUp,
    logIn,
    logOut,
    updateProfile,
    updateAvatar,
    requestParentApproval,
    approveTeenAccount,
    addPaymentMethod,
    removePaymentMethod,
    isLoading: authQuery.isLoading,
  }), [isAuthenticated, isReady, user, signUp, logIn, logOut, updateProfile, updateAvatar, requestParentApproval, approveTeenAccount, addPaymentMethod, removePaymentMethod, authQuery.isLoading]);
});
