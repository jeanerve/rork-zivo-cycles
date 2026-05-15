import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Challenge, UserChallenge } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

const BUILT_IN_CHALLENGES: Challenge[] = [
  {
    id: 'no-spend-week',
    title: 'No-Spend Week',
    description: 'No non-essential purchases for 7 days. Reset your relationship with money.',
    type: 'no_spend',
    durationDays: 7,
    participants: 2847,
    emoji: '🌿',
    color: '#14B8A6',
  },
  {
    id: 'save-5-daily',
    title: 'Save $5 Daily',
    description: 'Put $5 away every single day for 30 days. Small reps. Big results.',
    type: 'daily_save',
    durationDays: 30,
    dailyAmount: 5,
    targetAmount: 150,
    participants: 5320,
    emoji: '☕',
    color: '#00E676',
  },
  {
    id: 'student-saver',
    title: 'Student Saver',
    description: 'Save $200 across 60 days while juggling everything else.',
    type: 'student',
    durationDays: 60,
    targetAmount: 200,
    participants: 1893,
    emoji: '🎓',
    color: '#3B82F6',
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund Sprint',
    description: 'Build a $1,000 cushion in 90 days. Sleep better at night.',
    type: 'emergency_fund',
    durationDays: 90,
    targetAmount: 1000,
    participants: 4102,
    emoji: '🛡️',
    color: '#A855F7',
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Skip one impulse purchase each weekend for a month.',
    type: 'custom',
    durationDays: 28,
    participants: 1234,
    emoji: '🏔️',
    color: '#F97316',
  },
];

function userChallengesKey(userId: string): string {
  return `zivo_user_challenges_${userId}`;
}

export const [ChallengesProvider, useChallenges] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [joined, setJoined] = useState<UserChallenge[]>([]);

  const joinedQuery = useQuery({
    queryKey: ['user-challenges', userId],
    queryFn: async () => {
      if (!userId) return [];
      const stored = await AsyncStorage.getItem(userChallengesKey(userId));
      return stored ? (JSON.parse(stored) as UserChallenge[]) : [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (joinedQuery.data) setJoined(joinedQuery.data);
  }, [joinedQuery.data]);

  const sync = useMutation({
    mutationFn: async (updated: UserChallenge[]) => {
      if (!userId) return updated;
      await AsyncStorage.setItem(userChallengesKey(userId), JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-challenges', userId] });
    },
  });

  const joinChallenge = useCallback((challengeId: string) => {
    if (!userId) return;
    if (joined.some(j => j.challengeId === challengeId && j.status === 'active')) return;
    const entry: UserChallenge = {
      id: `uc-${Date.now()}`,
      challengeId,
      joinedAt: new Date().toISOString(),
      progress: 0,
      status: 'active',
      daysCompleted: 0,
    };
    const updated = [entry, ...joined];
    setJoined(updated);
    sync.mutate(updated);
  }, [userId, joined, sync]);

  const leaveChallenge = useCallback((userChallengeId: string) => {
    const updated = joined.filter(j => j.id !== userChallengeId);
    setJoined(updated);
    sync.mutate(updated);
  }, [joined, sync]);

  const updateProgress = useCallback((userChallengeId: string, daysCompleted: number) => {
    const updated = joined.map(j => {
      if (j.id !== userChallengeId) return j;
      const challenge = BUILT_IN_CHALLENGES.find(c => c.id === j.challengeId);
      const total = challenge?.durationDays ?? 30;
      const progress = Math.min(1, daysCompleted / total);
      const isComplete = daysCompleted >= total;
      return {
        ...j,
        daysCompleted,
        progress,
        status: isComplete ? ('completed' as const) : j.status,
        completedAt: isComplete ? new Date().toISOString() : j.completedAt,
      };
    });
    setJoined(updated);
    sync.mutate(updated);
  }, [joined, sync]);

  const activeChallenges = useMemo(
    () => joined.filter(j => j.status === 'active'),
    [joined]
  );

  return useMemo(() => ({
    challenges: BUILT_IN_CHALLENGES,
    joined,
    activeChallenges,
    joinChallenge,
    leaveChallenge,
    updateProgress,
    isLoading: joinedQuery.isLoading,
  }), [joined, activeChallenges, joinChallenge, leaveChallenge, updateProgress, joinedQuery.isLoading]);
});
