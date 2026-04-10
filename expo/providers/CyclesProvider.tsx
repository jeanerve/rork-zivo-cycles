import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Cycle, Notification, Contribution, CycleType, ContributionFrequency, Member, MemberPermission, WithdrawalRequest, PaymentRecord, PaymentStatus, DisciplineInfo } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { sendInviteEmail, sendInviteSms, shareCyclePlanToAll, sendParentNotificationEmail } from '@/utils/sendInvite';

const GROUP_TYPES = ['family', 'community'];

function userCyclesKey(userId: string): string {
  return `zivo_cycles_${userId}`;
}

function userNotificationsKey(userId: string): string {
  return `zivo_notifications_${userId}`;
}

function generateInviteLink(cycleId: string, memberId: string): string {
  const token = `${cycleId}-${memberId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `https://zivo.app/invite/${token}`;
}

function calculateDynamicStreak(cycles: Cycle[]): number {
  if (cycles.length === 0) return 0;
  const allContributions: Contribution[] = [];
  for (const c of cycles) {
    if (c.status === 'completed') continue;
    for (const contrib of c.contributions) {
      if (contrib.type === 'contribution') {
        allContributions.push(contrib);
      }
    }
  }
  if (allContributions.length === 0) return 0;

  const daySet = new Set<string>();
  for (const c of allContributions) {
    const d = new Date(c.date);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  const sortedDays = Array.from(daySet).sort().reverse();
  let streak = 0;
  const today = new Date();
  let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const dayStr of sortedDays) {
    const checkStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (dayStr === checkStr) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      const yesterday = new Date(checkDate.getTime());
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
      if (dayStr === yesterdayStr) {
        streak++;
        checkDate = new Date(yesterday.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  return Math.max(streak, 1);
}

const GRACE_PERIOD_DAYS = 3;

function getFrequencyDays(freq: ContributionFrequency): number {
  switch (freq) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
  }
}

function generatePaymentSchedule(cycle: Cycle, userId: string): PaymentRecord[] {
  if (cycle.status === 'completed' || !cycle.startDate) return [];

  const start = new Date(cycle.startDate);
  const now = new Date();
  const end = new Date(cycle.endDate);
  const freqDays = getFrequencyDays(cycle.frequency);
  const memberCount = Math.max(1, cycle.members.length);
  const totalPeriods = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (freqDays * 86400000)));
  const requiredPerPeriod = cycle.goalAmount / totalPeriods / memberCount;

  const userContribs = cycle.contributions
    .filter(c => c.memberId === userId && c.type === 'contribution')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const records: PaymentRecord[] = [];
  let carryOver = 0;

  for (let i = 0; i < totalPeriods; i++) {
    const dueDate = new Date(start.getTime() + (i + 1) * freqDays * 86400000);
    if (dueDate > end) break;

    const periodStart = new Date(start.getTime() + i * freqDays * 86400000);

    const gracePeriodEnd = new Date(dueDate.getTime() + GRACE_PERIOD_DAYS * 86400000);

    const periodContribs = userContribs.filter(c => {
      const d = new Date(c.date);
      return d >= periodStart && d < gracePeriodEnd;
    });

    const paidAmount = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    const totalDue = requiredPerPeriod + carryOver;
    const remaining = Math.max(0, totalDue - paidAmount);

    let status: PaymentStatus = 'upcoming';
    if (dueDate > now) {
      status = 'upcoming';
    } else if (paidAmount >= totalDue) {
      status = 'on_time';
      carryOver = 0;
    } else if (now <= gracePeriodEnd && paidAmount > 0 && paidAmount < totalDue) {
      status = 'grace_period';
    } else if (now <= gracePeriodEnd && paidAmount === 0) {
      status = 'grace_period';
    } else if (paidAmount > 0 && paidAmount < totalDue) {
      status = 'partial';
      carryOver = remaining;
    } else if (paidAmount === 0) {
      status = 'missed';
      carryOver = remaining;
    } else {
      status = 'late';
      carryOver = remaining;
    }

    if (status === 'on_time') {
      carryOver = 0;
    }

    records.push({
      id: `pr-${cycle.id}-${i}`,
      cycleId: cycle.id,
      memberId: userId,
      dueDate: dueDate.toISOString(),
      requiredAmount: requiredPerPeriod,
      paidAmount,
      remainingAmount: remaining,
      status,
      gracePeriodEnd: gracePeriodEnd.toISOString(),
      contributions: periodContribs.map(c => c.id),
      carryOver,
    });
  }

  return records;
}

function calculateDisciplineFromRecords(records: PaymentRecord[]): DisciplineInfo {
  const pastRecords = records.filter(r => r.status !== 'upcoming');
  if (pastRecords.length === 0) {
    return { score: 100, label: 'Highly Disciplined', onTimeCount: 0, lateCount: 0, missedCount: 0, partialCount: 0, totalPayments: 0 };
  }

  let onTimeCount = 0;
  let lateCount = 0;
  let missedCount = 0;
  let partialCount = 0;
  let graceCount = 0;

  for (const r of pastRecords) {
    switch (r.status) {
      case 'on_time': onTimeCount++; break;
      case 'late': lateCount++; break;
      case 'missed': missedCount++; break;
      case 'partial': partialCount++; break;
      case 'grace_period': graceCount++; break;
    }
  }

  const total = pastRecords.length;
  const weightedScore = (
    (onTimeCount * 100) +
    (graceCount * 80) +
    (partialCount * 50) +
    (lateCount * 30) +
    (missedCount * 0)
  ) / total;

  const score = Math.round(Math.min(100, Math.max(0, weightedScore)));
  let label = 'Needs Improvement';
  if (score >= 90) label = 'Highly Disciplined';
  else if (score >= 70) label = 'Consistent';

  return { score, label, onTimeCount, lateCount, missedCount, partialCount, totalPayments: total };
}

function calculateDisciplineScore(cycles: Cycle[], userId: string): number {
  if (cycles.length === 0) return 0;

  const allRecords: PaymentRecord[] = [];
  for (const c of cycles) {
    if (c.status === 'completed') {
      const completedContribs = c.contributions.filter(ct => ct.memberId === userId && ct.type === 'contribution').length;
      const totalExpected = Math.max(1, Math.ceil((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / (getFrequencyDays(c.frequency) * 86400000)));

      for (let i = 0; i < totalExpected; i++) {
        allRecords.push({
          id: `hist-${c.id}-${i}`,
          cycleId: c.id,
          memberId: userId,
          dueDate: new Date().toISOString(),
          requiredAmount: 0,
          paidAmount: i < completedContribs ? 1 : 0,
          remainingAmount: 0,
          status: i < completedContribs ? 'on_time' : 'missed',
          contributions: [],
          carryOver: 0,
        });
      }
      continue;
    }
    const records = generatePaymentSchedule(c, userId);
    allRecords.push(...records);
  }

  if (allRecords.length === 0) return 100;
  return calculateDisciplineFromRecords(allRecords).score;
}

export const [CyclesProvider, useCycles] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, updateProfile } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const cyclesRef = useRef(cycles);
  cyclesRef.current = cycles;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevUserIdRef = useRef<string | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      console.log('[Cycles] User changed from', prevUserIdRef.current, 'to', userId);
      setCycles([]);
      setNotifications([]);
      prevUserIdRef.current = userId;
    }
  }, [userId]);

  const cyclesQuery = useQuery({
    queryKey: ['cycles', userId],
    queryFn: async () => {
      if (!userId) return [];
      const key = userCyclesKey(userId);
      console.log('[Cycles] Loading cycles for user:', userId, 'key:', key);
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Cycle[];
        console.log('[Cycles] Found', parsed.length, 'stored cycles');
        return parsed;
      }
      console.log('[Cycles] No stored cycles, returning empty for new user');
      return [];
    },
    enabled: !!userId,
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const key = userNotificationsKey(userId);
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as Notification[];
      }
      return [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (cyclesQuery.data) setCycles(cyclesQuery.data);
  }, [cyclesQuery.data]);

  useEffect(() => {
    if (notificationsQuery.data) setNotifications(notificationsQuery.data);
  }, [notificationsQuery.data]);

  useEffect(() => {
    if (cycles.length > 0 && user) {
      const streak = calculateDynamicStreak(cycles);
      const discipline = calculateDisciplineScore(cycles, user.id);
      if (streak !== user.streak || discipline !== user.disciplineScore) {
        updateProfile({ streak, disciplineScore: discipline });
      }
    }
  }, [cycles, user, updateProfile]);

  const syncCycles = useMutation({
    mutationFn: async (updated: Cycle[]) => {
      if (!userId) return updated;
      await AsyncStorage.setItem(userCyclesKey(userId), JSON.stringify(updated));
      console.log('[Cycles] Synced', updated.length, 'cycles for user:', userId);
      return updated;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cycles', userId] });
    },
  });

  const syncNotifications = useMutation({
    mutationFn: async (updated: Notification[]) => {
      if (!userId) return updated;
      await AsyncStorage.setItem(userNotificationsKey(userId), JSON.stringify(updated));
      return updated;
    },
  });

  const addContribution = useCallback((cycleId: string, amount: number) => {
    if (!user) return;

    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle || cycle.status === 'completed') {
      console.log('[Cycles] Cannot contribute to completed cycle');
      return;
    }

    const isTeen = user.accountType === 'teen';
    const isApproved = user.parentApprovalStatus === 'approved';
    const parentEmail = user.parentEmail;

    const contribution: Contribution = {
      id: `c-${Date.now()}`,
      cycleId,
      memberId: user.id,
      memberName: user.name,
      amount,
      date: new Date().toISOString(),
      type: 'contribution',
    };

    let updatedCycles = cycles.map((c) => {
      if (c.id === cycleId) {
        const newAmount = c.currentAmount + amount;
        return {
          ...c,
          currentAmount: newAmount,
          contributions: [contribution, ...c.contributions],
          members: c.members.map((m) =>
            m.id === user.id ? { ...m, totalContributed: m.totalContributed + amount } : m
          ),
        };
      }
      return c;
    });

    const updatedCycle = updatedCycles.find(c => c.id === cycleId);
    let justCompleted = false;
    if (updatedCycle && updatedCycle.currentAmount >= updatedCycle.goalAmount && updatedCycle.status !== 'completed') {
      justCompleted = true;
      updatedCycles = updatedCycles.map(c => {
        if (c.id === cycleId) {
          return { ...c, status: 'completed' as const, completedAt: new Date().toISOString() };
        }
        return c;
      });
    }

    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    const totalSaved = updatedCycles.reduce((sum, c) => sum + c.currentAmount, 0);
    const completedCount = updatedCycles.filter(c => c.status === 'completed').length;
    updateProfile({ totalSaved, activeCycles: updatedCycles.filter(c => c.status !== 'completed').length, completedCycles: completedCount });

    const isGroup = GROUP_TYPES.includes(cycle.type);
    const newNotifications: Notification[] = [{
      id: `n-${Date.now()}`,
      title: 'Contribution Added',
      message: `You added $${amount.toFixed(0)} to ${updatedCycle?.name ?? 'cycle'}`,
      date: new Date().toISOString(),
      read: false,
      type: 'contribution',
      cycleId,
    }];

    if (justCompleted) {
      newNotifications.push({
        id: `n-complete-${Date.now()}`,
        title: 'Cycle Completed! 🎉',
        message: `Congratulations! "${updatedCycle?.name}" has reached its goal of $${updatedCycle?.goalAmount.toLocaleString()}!`,
        date: new Date().toISOString(),
        read: false,
        type: 'completion',
        cycleId,
      });
    }

    const updatedNotifications = [...newNotifications, ...notifications];
    setNotifications(updatedNotifications);
    syncNotifications.mutate(updatedNotifications);

    if (isGroup && updatedCycle) {
      const schedule = generatePaymentSchedule(updatedCycle, user.id);
      const latePayments = schedule.filter(r => r.status === 'partial' || r.status === 'missed' || r.status === 'grace_period');
      if (latePayments.length > 0) {
        const lastLate = latePayments[latePayments.length - 1];
        if (lastLate.status === 'partial' && lastLate.paidAmount > 0) {
          newNotifications.push({
            id: `n-partial-${Date.now()}`,
            title: 'Partial Payment Recorded',
            message: `${lastLate.remainingAmount.toFixed(0)} still remaining for ${updatedCycle.name}`,
            date: new Date().toISOString(),
            read: false,
            type: 'reminder',
            cycleId,
          });
        }
      }
    }

    if (isTeen && isApproved && parentEmail) {
      const cycleName = updatedCycle?.name ?? 'a cycle';
      void sendParentNotificationEmail(
        parentEmail,
        user.name,
        `${user.name} added a ${amount.toFixed(0)} contribution to "${cycleName}".`,
        'Contribution Made'
      );
    }

    return { contribution, justCompleted };
  }, [cycles, notifications, user, syncCycles, syncNotifications, updateProfile]);

  const completeCycle = useCallback((cycleId: string) => {
    const updatedCycles = cycles.map(c => {
      if (c.id === cycleId) {
        return { ...c, status: 'completed' as const, completedAt: new Date().toISOString() };
      }
      return c;
    });
    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    const cycleName = cycles.find(c => c.id === cycleId)?.name ?? '';
    const completionNotification: Notification = {
      id: `n-complete-${Date.now()}`,
      title: 'Cycle Completed! 🎉',
      message: `"${cycleName}" has been completed successfully!`,
      date: new Date().toISOString(),
      read: false,
      type: 'completion',
      cycleId,
    };
    const updatedNotifications = [completionNotification, ...notifications];
    setNotifications(updatedNotifications);
    syncNotifications.mutate(updatedNotifications);

    const completedCount = updatedCycles.filter(c => c.status === 'completed').length;
    updateProfile({ completedCycles: completedCount, activeCycles: updatedCycles.filter(c => c.status !== 'completed').length });
  }, [cycles, notifications, syncCycles, syncNotifications, updateProfile]);

  const getUserContribution = useCallback((cycleId: string): number => {
    if (!user) return 0;
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return 0;
    const member = cycle.members.find(m => m.id === user.id);
    return member?.totalContributed ?? 0;
  }, [cycles, user]);

  const requestGroupWithdrawal = useCallback((cycleId: string, amount: number, reason: string) => {
    if (!user) return;
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;

    const userContribution = getUserContribution(cycleId);
    const safeAmount = Math.min(amount, userContribution);

    if (safeAmount <= 0) {
      console.log('[Cycles] No contributions to withdraw');
      return;
    }

    const isGroup = GROUP_TYPES.includes(cycle.type);
    if (!isGroup) {
      const withdrawal: Contribution = {
        id: `w-${Date.now()}`,
        cycleId,
        memberId: user.id,
        memberName: user.name,
        amount: safeAmount,
        date: new Date().toISOString(),
        type: 'withdrawal',
      };
      const updatedCycles = cycles.map(c => {
        if (c.id === cycleId) {
          return {
            ...c,
            currentAmount: Math.max(0, c.currentAmount - safeAmount),
            contributions: [withdrawal, ...c.contributions],
            members: c.members.map(m =>
              m.id === user.id ? { ...m, totalContributed: Math.max(0, m.totalContributed - safeAmount) } : m
            ),
          };
        }
        return c;
      });
      setCycles(updatedCycles);
      syncCycles.mutate(updatedCycles);
      const totalSaved = updatedCycles.reduce((sum, c) => sum + c.currentAmount, 0);
      updateProfile({ totalSaved });
      return;
    }

    const otherMembers = cycle.members.filter(m => m.id !== user.id && m.role !== 'guardian');
    const requiredApprovals = Math.max(1, Math.ceil(otherMembers.length / 2));

    const request: WithdrawalRequest = {
      id: `wr-${Date.now()}`,
      cycleId,
      requesterId: user.id,
      requesterName: user.name,
      amount: safeAmount,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvals: [],
      requiredApprovals,
    };

    const updatedCycles = cycles.map(c => {
      if (c.id === cycleId) {
        return { ...c, withdrawalRequests: [...(c.withdrawalRequests ?? []), request] };
      }
      return c;
    });
    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    const requestNotification: Notification = {
      id: `n-wr-${Date.now()}`,
      title: 'Withdrawal Request Submitted',
      message: `Your request to withdraw $${safeAmount.toLocaleString()} from "${cycle.name}" needs ${requiredApprovals} approval${requiredApprovals !== 1 ? 's' : ''}.`,
      date: new Date().toISOString(),
      read: false,
      type: 'withdrawal_request',
      cycleId,
    };
    const updatedNotifications = [requestNotification, ...notifications];
    setNotifications(updatedNotifications);
    syncNotifications.mutate(updatedNotifications);

    console.log('[Cycles] Withdrawal request created, needs', requiredApprovals, 'approvals');
  }, [cycles, notifications, user, syncCycles, syncNotifications, updateProfile, getUserContribution]);

  const approveWithdrawal = useCallback((cycleId: string, requestId: string, approved: boolean) => {
    if (!user) return;

    const updatedCycles = cycles.map(c => {
      if (c.id !== cycleId) return c;
      const requests = (c.withdrawalRequests ?? []).map(req => {
        if (req.id !== requestId) return req;
        const newApproval = { memberId: user.id, memberName: user.name, approved, date: new Date().toISOString() };
        const updatedApprovals = [...req.approvals.filter(a => a.memberId !== user.id), newApproval];
        const approvedCount = updatedApprovals.filter(a => a.approved).length;
        const deniedCount = updatedApprovals.filter(a => !a.approved).length;

        let newStatus = req.status;
        if (approvedCount >= req.requiredApprovals) {
          newStatus = 'approved' as const;
        } else if (deniedCount > (c.members.length - 1 - req.requiredApprovals)) {
          newStatus = 'denied' as const;
        }

        return { ...req, approvals: updatedApprovals, status: newStatus };
      });

      const approvedRequest = requests.find(r => r.id === requestId && r.status === 'approved');
      if (approvedRequest) {
        const withdrawal: Contribution = {
          id: `w-${Date.now()}`,
          cycleId,
          memberId: approvedRequest.requesterId,
          memberName: approvedRequest.requesterName,
          amount: approvedRequest.amount,
          date: new Date().toISOString(),
          type: 'withdrawal',
        };
        return {
          ...c,
          currentAmount: Math.max(0, c.currentAmount - approvedRequest.amount),
          contributions: [withdrawal, ...c.contributions],
          members: c.members.map(m =>
            m.id === approvedRequest.requesterId
              ? { ...m, totalContributed: Math.max(0, m.totalContributed - approvedRequest.amount) }
              : m
          ),
          withdrawalRequests: requests,
        };
      }

      return { ...c, withdrawalRequests: requests };
    });

    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    const totalSaved = updatedCycles.reduce((sum, c) => sum + c.currentAmount, 0);
    updateProfile({ totalSaved });
  }, [cycles, user, syncCycles, updateProfile]);

  const requestWithdrawal = useCallback((cycleId: string, amount: number) => {
    if (!user) return;

    const updatedCycles = cycles.map((c) => {
      if (c.id === cycleId) {
        const withdrawal: Contribution = {
          id: `w-${Date.now()}`,
          cycleId,
          memberId: user.id,
          memberName: user.name,
          amount,
          date: new Date().toISOString(),
          type: 'withdrawal',
        };
        return {
          ...c,
          currentAmount: Math.max(0, c.currentAmount - amount),
          contributions: [withdrawal, ...c.contributions],
        };
      }
      return c;
    });

    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    const totalSaved = updatedCycles.reduce((sum, c) => sum + c.currentAmount, 0);
    updateProfile({ totalSaved });
  }, [cycles, user, syncCycles, updateProfile]);

  const createCycle = useCallback((params: {
    name: string;
    type: CycleType;
    goalAmount: number;
    endDate: string;
    frequency: ContributionFrequency;
    members?: Member[];
    purpose?: string;
    motivation?: string;
  }) => {
    if (!user) return;

    const isTeen = user.accountType === 'teen';
    const isApproved = user.parentApprovalStatus === 'approved';
    const parentEmail = user.parentEmail;

    const ownerMember: Member = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      totalContributed: 0,
      role: 'owner',
      email: user.email,
      inviteStatus: 'accepted',
      permissions: ['view', 'contribute', 'manage'],
    };

    const cycleId = `cycle-${Date.now()}`;

    const additionalMembers: Member[] = (params.members ?? []).map((m) => {
      const memberId = m.id || `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return {
        ...m,
        id: memberId,
        totalContributed: 0,
        role: m.role ?? 'member' as const,
        inviteStatus: m.inviteStatus ?? 'pending' as const,
        inviteLink: generateInviteLink(cycleId, memberId),
        inviteSentAt: new Date().toISOString(),
        permissions: m.permissions ?? ['view', 'contribute'],
      };
    });

    const allMembers = [ownerMember, ...additionalMembers];

    const newCycle: Cycle = {
      id: cycleId,
      name: params.name,
      type: params.type,
      goalAmount: params.goalAmount,
      currentAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: params.endDate,
      frequency: params.frequency,
      members: allMembers,
      contributions: [],
      createdBy: user.id,
      color: params.type === 'individual' ? '#3B82F6' : params.type === 'family' ? '#A855F7' : params.type === 'community' ? '#14B8A6' : '#00E676',
      icon: params.type === 'individual' ? 'user' : params.type === 'family' ? 'home' : params.type === 'community' ? 'users' : 'graduation-cap',
      parentApprovalRequired: params.type === 'teen',
      status: 'active',
      withdrawalRequests: [],
      purpose: params.purpose,
      motivation: params.motivation,
    };

    const updatedCycles = [newCycle, ...cycles];
    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    updateProfile({ activeCycles: updatedCycles.filter(c => c.status !== 'completed').length });

    if (additionalMembers.length > 0) {
      console.log('[Cycles] Sending invites to', additionalMembers.length, 'members');
      const sendAllInvites = async () => {
        for (const m of additionalMembers) {
          if (m.email && m.inviteLink) {
            await sendInviteEmail(m, params.name, m.inviteLink);
          }
          if (m.phone && m.inviteLink) {
            await sendInviteSms(m, params.name, m.inviteLink);
          }
        }
      };
      void sendAllInvites();

      const inviteNotifications: Notification[] = additionalMembers.map((m, idx) => ({
        id: `n-invite-${Date.now()}-${idx}`,
        title: 'Invite Sent',
        message: `Invite sent to ${m.name}${m.email ? ` (${m.email})` : ''}`,
        date: new Date().toISOString(),
        read: false,
        type: 'member' as const,
        cycleId,
      }));
      const updatedNotifications = [...inviteNotifications, ...notifications];
      setNotifications(updatedNotifications);
      syncNotifications.mutate(updatedNotifications);
    }

    if (isTeen && isApproved && parentEmail) {
      void sendParentNotificationEmail(
        parentEmail,
        user.name,
        `${user.name} created a new cycle called "${params.name}" with a goal of $${params.goalAmount.toLocaleString()}.`,
        'New Cycle Created'
      );
    }

    return newCycle;
  }, [cycles, notifications, user, syncCycles, syncNotifications, updateProfile]);

  const updateCycleMembers = useCallback((cycleId: string, members: Member[]) => {
    const updatedCycles = cyclesRef.current.map((c) => {
      if (c.id === cycleId) {
        return { ...c, members };
      }
      return c;
    });
    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);
  }, [syncCycles]);

  const inviteMemberToCycle = useCallback((cycleId: string, memberData: {
    name: string;
    email: string;
    phone?: string;
    permissions?: MemberPermission[];
  }) => {
    if (!user) return;

    const memberId = `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const inviteLink = generateInviteLink(cycleId, memberId);

    const newMember: Member = {
      id: memberId,
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(memberData.name)}&background=00E676&color=000&size=200&bold=true`,
      totalContributed: 0,
      role: 'member',
      inviteStatus: 'pending',
      inviteLink,
      inviteSentAt: new Date().toISOString(),
      permissions: memberData.permissions ?? ['view', 'contribute'],
    };

    const updatedCycles = cyclesRef.current.map((c) => {
      if (c.id === cycleId) {
        return { ...c, members: [...c.members, newMember] };
      }
      return c;
    });
    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    const cycleName = cyclesRef.current.find((c) => c.id === cycleId)?.name ?? 'Zivo Cycle';
    void (async () => {
      if (newMember.email) {
        await sendInviteEmail(newMember, cycleName, inviteLink);
      }
      if (newMember.phone) {
        await sendInviteSms(newMember, cycleName, inviteLink);
      }
    })();

    const inviteNotification: Notification = {
      id: `n-invite-${Date.now()}`,
      title: 'Invite Sent',
      message: `Invite sent to ${newMember.name} (${newMember.email})`,
      date: new Date().toISOString(),
      read: false,
      type: 'member',
      cycleId,
    };
    const updatedNotifications = [inviteNotification, ...notifications];
    setNotifications(updatedNotifications);
    syncNotifications.mutate(updatedNotifications);

    return newMember;
  }, [user, notifications, syncCycles, syncNotifications]);

  const resendInvite = useCallback((cycleId: string, memberId: string) => {
    const cycle = cyclesRef.current.find((c) => c.id === cycleId);
    const member = cycle?.members.find((m) => m.id === memberId);
    const newLink = generateInviteLink(cycleId, memberId);

    const updatedCycles = cyclesRef.current.map((c) => {
      if (c.id === cycleId) {
        return {
          ...c,
          members: c.members.map((m) => {
            if (m.id === memberId) {
              return { ...m, inviteLink: newLink, inviteSentAt: new Date().toISOString() };
            }
            return m;
          }),
        };
      }
      return c;
    });
    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);

    if (member) {
      void (async () => {
        if (member.email) {
          await sendInviteEmail({ ...member, inviteLink: newLink }, cycle?.name ?? 'Zivo Cycle', newLink);
        }
        if (member.phone) {
          await sendInviteSms({ ...member, inviteLink: newLink }, cycle?.name ?? 'Zivo Cycle', newLink);
        }
      })();

      const resendNotification: Notification = {
        id: `n-resend-${Date.now()}`,
        title: 'Invite Resent',
        message: `Invite resent to ${member.name}${member.email ? ` (${member.email})` : ''}`,
        date: new Date().toISOString(),
        read: false,
        type: 'member',
        cycleId,
      };
      const updatedNotifications = [resendNotification, ...notifications];
      setNotifications(updatedNotifications);
      syncNotifications.mutate(updatedNotifications);
    }
  }, [notifications, syncCycles, syncNotifications]);

  const updateMemberPermissions = useCallback((cycleId: string, memberId: string, permissions: MemberPermission[]) => {
    const updatedCycles = cyclesRef.current.map((c) => {
      if (c.id === cycleId) {
        return {
          ...c,
          members: c.members.map((m) =>
            m.id === memberId ? { ...m, permissions } : m
          ),
        };
      }
      return c;
    });
    setCycles(updatedCycles);
    syncCycles.mutate(updatedCycles);
  }, [syncCycles]);

  const shareCyclePlan = useCallback(async (cycleId: string) => {
    const cycle = cyclesRef.current.find((c) => c.id === cycleId);
    if (!cycle) return;

    const memberCount = cycle.members.length;
    const result = await shareCyclePlanToAll(cycle);

    const shareNotification: Notification = {
      id: `n-share-${Date.now()}`,
      title: 'Cycle Plan Shared',
      message: `Plan for "${cycle.name}" has been sent to all ${memberCount - 1} member${memberCount > 2 ? 's' : ''}`,
      date: new Date().toISOString(),
      read: false,
      type: 'milestone',
      cycleId,
    };
    const updatedNotifications = [shareNotification, ...notifications];
    setNotifications(updatedNotifications);
    syncNotifications.mutate(updatedNotifications);

    return result;
  }, [notifications, syncNotifications]);

  const markNotificationRead = useCallback((notificationId: string) => {
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    syncNotifications.mutate(updated);
  }, [notifications, syncNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const totalSaved = useMemo(() => cycles.reduce((sum, c) => sum + c.currentAmount, 0), [cycles]);

  const activeCycles = useMemo(() => cycles.filter(c => c.status !== 'completed'), [cycles]);
  const completedCycles = useMemo(() => cycles.filter(c => c.status === 'completed'), [cycles]);

  const isLoading = cyclesQuery.isLoading || notificationsQuery.isLoading;

  const getPaymentSchedule = useCallback((cycleId: string): PaymentRecord[] => {
    if (!user) return [];
    const cycle = cyclesRef.current.find(c => c.id === cycleId);
    if (!cycle) return [];
    return generatePaymentSchedule(cycle, user.id);
  }, [user]);

  const getCurrentPaymentDue = useCallback((cycleId: string): PaymentRecord | null => {
    const schedule = getPaymentSchedule(cycleId);
    const now = new Date();
    const graceOrUpcoming = schedule.find(r => {
      if (r.status === 'upcoming') {
        const due = new Date(r.dueDate);
        return due.getTime() - now.getTime() < getFrequencyDays('weekly') * 86400000;
      }
      return r.status === 'grace_period';
    });
    if (graceOrUpcoming) return graceOrUpcoming;
    const unpaid = schedule.filter(r => r.status === 'partial' || r.status === 'missed').pop();
    return unpaid ?? null;
  }, [getPaymentSchedule]);

  const getDisciplineInfo = useCallback((cycleId?: string): DisciplineInfo => {
    if (!user) return { score: 100, label: 'Highly Disciplined', onTimeCount: 0, lateCount: 0, missedCount: 0, partialCount: 0, totalPayments: 0 };
    const targetCycles = cycleId ? cyclesRef.current.filter(c => c.id === cycleId) : cyclesRef.current;
    const allRecords: PaymentRecord[] = [];
    for (const c of targetCycles) {
      allRecords.push(...generatePaymentSchedule(c, user.id));
    }
    return calculateDisciplineFromRecords(allRecords);
  }, [user]);

  const getCatchUpAmount = useCallback((cycleId: string): number => {
    const schedule = getPaymentSchedule(cycleId);
    let catchUp = 0;
    for (const r of schedule) {
      if (r.status === 'partial' || r.status === 'missed' || r.status === 'grace_period') {
        catchUp += r.remainingAmount;
      }
    }
    const upcoming = schedule.find(r => r.status === 'upcoming');
    if (upcoming) {
      catchUp += upcoming.requiredAmount;
    }
    return Math.round(catchUp * 100) / 100;
  }, [getPaymentSchedule]);

  return useMemo(() => ({
    cycles,
    activeCycles,
    completedCycles,
    notifications,
    isLoading,
    addContribution,
    requestWithdrawal,
    requestGroupWithdrawal,
    approveWithdrawal,
    completeCycle,
    getUserContribution,
    createCycle,
    updateCycleMembers,
    inviteMemberToCycle,
    resendInvite,
    updateMemberPermissions,
    shareCyclePlan,
    markNotificationRead,
    unreadCount,
    totalSaved,
    getPaymentSchedule,
    getCurrentPaymentDue,
    getDisciplineInfo,
    getCatchUpAmount,
  }), [cycles, activeCycles, completedCycles, notifications, isLoading, addContribution, requestWithdrawal, requestGroupWithdrawal, approveWithdrawal, completeCycle, getUserContribution, createCycle, updateCycleMembers, inviteMemberToCycle, resendInvite, updateMemberPermissions, shareCyclePlan, markNotificationRead, unreadCount, totalSaved, getPaymentSchedule, getCurrentPaymentDue, getDisciplineInfo, getCatchUpAmount]);
});

export function useCycleById(id: string) {
  const { cycles } = useCycles();
  return useMemo(() => cycles.find((c) => c.id === id), [cycles, id]);
}
