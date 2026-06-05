import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Plus, AlertTriangle, TrendingUp, Clock, Users, Trophy, UserPlus, Send, Share2, ChevronRight, CheckCircle, XCircle, Lock, Target, Flame, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useCycles, useCycleById } from '@/providers/CyclesProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import GrowthGraph from '@/components/GrowthGraph';
import ContributionModal from '@/components/ContributionModal';
import InviteMemberModal from '@/components/InviteMemberModal';
import MemberDetailSheet from '@/components/MemberDetailSheet';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import AchievementPostModal from '@/components/AchievementPostModal';
import { GraphDataPoint, Contribution, Member, MemberPermission, CycleStage } from '@/types';

const GROUP_TYPES = ['family', 'community'];

function buildGraphData(contributions: Contribution[]): GraphDataPoint[] {
  const sorted = [...contributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let running = 0;
  return sorted.map((c) => {
    if (c.type === 'contribution') running += c.amount;
    else running -= c.amount;
    return {
      date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: Math.max(0, running),
    };
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCycleStage(progress: number, isCompleted: boolean, hasPost: boolean): CycleStage {
  if (hasPost) return 'achieved';
  if (isCompleted) return 'completed';
  if (progress >= 0.8) return 'almost_there';
  if (progress > 0) return 'in_progress';
  return 'start';
}

function getStageInfo(stage: CycleStage): { label: string; emoji: string; color: string } {
  switch (stage) {
    case 'start': return { label: 'Getting Started', emoji: '🚀', color: '#3B82F6' };
    case 'in_progress': return { label: 'In Progress', emoji: '💪', color: '#F59E0B' };
    case 'almost_there': return { label: 'Almost There', emoji: '🔥', color: '#F97316' };
    case 'completed': return { label: 'Goal Reached', emoji: '🎯', color: '#00E676' };
    case 'achieved': return { label: 'Achievement Shared', emoji: '⭐', color: '#FFD700' };
  }
}

const STAGE_ORDER: CycleStage[] = ['start', 'in_progress', 'almost_there', 'completed', 'achieved'];

export default function CycleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cycle = useCycleById(id ?? '');
  const { user } = useAuth();
  const { colors } = useTheme();
  const { addContribution, requestGroupWithdrawal, approveWithdrawal, getUserContribution, updateCycleMembers, inviteMemberToCycle, resendInvite, updateMemberPermissions, shareCyclePlan, getCurrentPaymentDue, getDisciplineInfo, getCatchUpAmount, getPaymentSchedule } = useCycles();
  const [showContribute, setShowContribute] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [showAchievementPost, setShowAchievementPost] = useState(false);
  const { createPost, getPostForCycle } = useFeed();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleShareAchievement = useCallback(() => {
    setShowAchievementPost(true);
  }, []);

  const handlePostAchievement = useCallback((data: { title: string; description: string; imageUrl?: string }) => {
    if (!cycle) return;
    createPost({
      cycleId: cycle.id,
      cycleName: cycle.name,
      title: data.title,
      description: data.description,
      amountSaved: cycle.currentAmount,
      imageUrl: data.imageUrl,
    });
    setShowAchievementPost(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Achievement Shared!', 'Your achievement has been posted to the Zivo Feed.');
  }, [cycle, createPost]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleContribute = useCallback((amount: number) => {
    if (!cycle) return;
    const result = addContribution(cycle.id, amount);
    if (result && typeof result === 'object' && 'justCompleted' in result && result.justCompleted) {
      setTimeout(() => setShowCelebration(true), 500);
    }
  }, [cycle, addContribution]);

  const handleWithdrawal = useCallback(() => {
    if (!cycle || !user) return;

    if (cycle.status === 'completed') {
      Alert.alert('Cycle Completed', 'This cycle has been completed. Withdrawals are no longer available.');
      return;
    }

    if (cycle.type === 'teen') {
      Alert.alert('Parent Approval Required', 'Emergency withdrawals from Teen cycles require parent/guardian approval.');
      return;
    }

    const isGroup = GROUP_TYPES.includes(cycle.type);
    const userContribution = getUserContribution(cycle.id);

    if (userContribution <= 0) {
      Alert.alert('No Contributions', 'You have no contributions to withdraw from this cycle.');
      return;
    }

    if (isGroup) {
      setWithdrawAmount(userContribution.toString());
      setWithdrawReason('');
      setShowWithdrawModal(true);
    } else {
      Alert.alert(
        'Withdraw Funds',
        `You can withdraw up to $${userContribution.toLocaleString()} (your total contribution). This may affect your discipline score.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Withdraw',
            style: 'destructive',
            onPress: () => {
              requestGroupWithdrawal(cycle.id, userContribution, 'Personal withdrawal');
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            },
          },
        ]
      );
    }
  }, [cycle, user, getUserContribution, requestGroupWithdrawal]);

  const handleSubmitWithdrawal = useCallback(() => {
    if (!cycle) return;
    const amount = parseFloat(withdrawAmount);
    const userContribution = getUserContribution(cycle.id);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (amount > userContribution) {
      Alert.alert('Exceeds Contribution', `You can only withdraw up to $${userContribution.toLocaleString()} (your total contribution).`);
      return;
    }

    requestGroupWithdrawal(cycle.id, amount, withdrawReason || 'Withdrawal request');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowWithdrawModal(false);
    Alert.alert('Request Submitted', 'Your withdrawal request has been sent to other cycle members for approval.');
  }, [cycle, withdrawAmount, withdrawReason, getUserContribution, requestGroupWithdrawal]);

  const handleApproveWithdrawal = useCallback((requestId: string, approved: boolean) => {
    if (!cycle) return;
    approveWithdrawal(cycle.id, requestId, approved);
    void Haptics.notificationAsync(approved ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    Alert.alert(approved ? 'Approved' : 'Denied', approved ? 'You approved the withdrawal request.' : 'You denied the withdrawal request.');
  }, [cycle, approveWithdrawal]);

  const handleInviteMember = useCallback((data: { name: string; email: string; phone: string; permissions: MemberPermission[] }) => {
    if (!cycle) return;
    inviteMemberToCycle(cycle.id, { name: data.name, email: data.email, phone: data.phone || undefined, permissions: data.permissions });
    Alert.alert('Invite Sent', `An invite has been sent to ${data.name} at ${data.email}.`);
  }, [cycle, inviteMemberToCycle]);

  const handleRemoveMember = useCallback((memberId: string) => {
    if (!cycle) return;
    updateCycleMembers(cycle.id, cycle.members.filter((m) => m.id !== memberId));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [cycle, updateCycleMembers]);

  const handleResendInvite = useCallback((memberId: string) => {
    if (!cycle) return;
    resendInvite(cycle.id, memberId);
    const member = cycle.members.find((m) => m.id === memberId);
    Alert.alert('Invite Resent', `A new invite is being sent to ${member?.name ?? 'the member'}.`);
  }, [cycle, resendInvite]);

  const handleUpdatePermissions = useCallback((memberId: string, permissions: MemberPermission[]) => {
    if (!cycle) return;
    updateMemberPermissions(cycle.id, memberId, permissions);
  }, [cycle, updateMemberPermissions]);

  const handleSharePlan = useCallback(async () => {
    if (!cycle) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const membersWithEmail = cycle.members.filter((m) => m.email && m.role !== 'owner').length;
    if (membersWithEmail > 0) {
      const result = await shareCyclePlan(cycle.id);
      if (result && result.sent > 0) {
        Alert.alert('Plan Shared', `The cycle plan has been sent to ${result.sent} member${result.sent !== 1 ? 's' : ''}.`);
      }
    } else {
      Alert.alert('No Members to Share', 'Add members with email addresses to share the cycle plan.');
    }
  }, [cycle, shareCyclePlan]);

  const handleMemberTap = useCallback((member: Member) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMember(member);
    setShowMemberDetail(true);
  }, []);

  if (!cycle) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>Cycle not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backLink, { backgroundColor: colors.card }]}>
            <Text style={[styles.backLinkText, { color: colors.green }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = cycle.goalAmount > 0 ? cycle.currentAmount / cycle.goalAmount : 0;
  const typeColor = cycle.color ?? colors.green;
  const graphData = buildGraphData(cycle.contributions);
  const sortedMembers = [...cycle.members].sort((a, b) => b.totalContributed - a.totalContributed);
  const isGroupCycle = GROUP_TYPES.includes(cycle.type);
  const isCompleted = cycle.status === 'completed';
  const pendingWithdrawals = (cycle.withdrawalRequests ?? []).filter(r => r.status === 'pending');
  const userContribution = getUserContribution(cycle.id);
  const existingPost = getPostForCycle(cycle.id);
  const cycleStage = getCycleStage(progress, isCompleted, !!existingPost);
  const stageInfo = getStageInfo(cycleStage);
  const currentStageIndex = STAGE_ORDER.indexOf(cycleStage);

  const userContribCount = useMemo(() => {
    return cycle.contributions.filter(c => c.memberId === user?.id && c.type === 'contribution').length;
  }, [cycle.contributions, user?.id]);

  const currentPayment = useMemo(() => getCurrentPaymentDue(cycle.id), [cycle.id, getCurrentPaymentDue]);
  const disciplineInfo = useMemo(() => getDisciplineInfo(cycle.id), [cycle.id, getDisciplineInfo]);
  const catchUpAmount = useMemo(() => getCatchUpAmount(cycle.id), [cycle.id, getCatchUpAmount]);
  const paymentSchedule = useMemo(() => getPaymentSchedule(cycle.id), [cycle.id, getPaymentSchedule]);

  const missedDays = useMemo(() => {
    return paymentSchedule.filter(r => r.status === 'missed').length;
  }, [paymentSchedule]);

  const completionRate = disciplineInfo.score;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} testID="back-btn">
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {isGroupCycle && (
              <TouchableOpacity onPress={handleSharePlan} style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Share2 size={16} color={typeColor} />
              </TouchableOpacity>
            )}
            {isCompleted && (
              <View style={[styles.completedTag, { backgroundColor: colors.greenMuted }]}>
                <CheckCircle size={12} color={colors.green} />
                <Text style={[styles.completedText, { color: colors.green }]}>Completed</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.cycleName, { color: colors.text }]}>{cycle.name}</Text>

          {cycle.purpose ? (
            <View style={[styles.purposeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Target size={14} color={colors.green} />
              <View style={styles.purposeContent}>
                <Text style={[styles.purposeLabel, { color: colors.textMuted }]}>Saving for</Text>
                <Text style={[styles.purposeText, { color: colors.text }]}>{cycle.purpose}</Text>
                {cycle.motivation ? (
                  <Text style={[styles.motivationText, { color: colors.textSecondary }]}>{cycle.motivation}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={[styles.journeyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.journeyHeader}>
              <Text style={[styles.journeyTitle, { color: colors.text }]}>Journey</Text>
              <View style={[styles.stageBadge, { backgroundColor: stageInfo.color + '1A' }]}>
                <Text style={styles.stageEmoji}>{stageInfo.emoji}</Text>
                <Text style={[styles.stageLabel, { color: stageInfo.color }]}>{stageInfo.label}</Text>
              </View>
            </View>
            <View style={styles.stagesRow}>
              {STAGE_ORDER.map((stage, idx) => {
                const reached = idx <= currentStageIndex;
                const info = getStageInfo(stage);
                return (
                  <View key={stage} style={styles.stageItem}>
                    <View style={[
                      styles.stageDot,
                      reached ? { backgroundColor: info.color } : { backgroundColor: colors.surfaceLight }
                    ]}>
                      {reached && <CheckCircle size={10} color="#000" />}
                    </View>
                    {idx < STAGE_ORDER.length - 1 && (
                      <View style={[
                        styles.stageLine,
                        reached ? { backgroundColor: info.color + '44' } : { backgroundColor: colors.surfaceLight }
                      ]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.progressSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.amountRow}>
              <Text style={[styles.currentAmount, { color: colors.text }]}>${cycle.currentAmount.toLocaleString()}</Text>
              <Text style={[styles.goalAmount, { color: colors.textMuted }]}>of ${cycle.goalAmount.toLocaleString()}</Text>
            </View>
            <AnimatedProgressBar progress={progress} color={typeColor} height={8} />
            <View style={styles.progressMeta}>
              <Text style={[styles.percentText, { color: colors.textSecondary }]}>{Math.round(progress * 100)}% complete</Text>
              <View style={styles.dateRow}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={[styles.dateText, { color: colors.textMuted }]}>
                  {isCompleted ? `Completed ${cycle.completedAt ? formatDate(cycle.completedAt) : ''}` : `Ends ${formatDate(cycle.endDate)}`}
                </Text>
              </View>
            </View>
            {userContribution > 0 && (
              <View style={[styles.userContribRow, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.userContribLabel, { color: colors.textMuted }]}>Your contribution</Text>
                <Text style={[styles.userContribAmount, { color: colors.green }]}>${userContribution.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {!isCompleted && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.contributeBtn, { backgroundColor: colors.green }]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowContribute(true);
                }}
                testID="add-contribution-btn"
              >
                <Plus size={18} color={colors.background} />
                <Text style={[styles.contributeBtnText, { color: colors.background }]}>Add Contribution</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.withdrawBtn, { backgroundColor: colors.dangerMuted, borderColor: colors.danger + '33' }]}
                onPress={handleWithdrawal}
                testID="withdrawal-btn"
              >
                <AlertTriangle size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}

          {!isCompleted && currentPayment && (currentPayment.status === 'grace_period' || currentPayment.status === 'partial' || currentPayment.status === 'missed') && (
            <View style={[
              styles.paymentDueCard,
              {
                backgroundColor: currentPayment.status === 'grace_period' ? colors.warningMuted : colors.dangerMuted,
                borderColor: currentPayment.status === 'grace_period' ? colors.warning + '33' : colors.danger + '33',
              }
            ]}>
              <View style={styles.paymentDueHeader}>
                <Clock size={18} color={currentPayment.status === 'grace_period' ? colors.warning : colors.danger} />
                <Text style={[
                  styles.paymentDueTitle,
                  { color: currentPayment.status === 'grace_period' ? colors.warning : colors.danger }
                ]}>
                  {currentPayment.status === 'grace_period'
                    ? 'Grace Period Active'
                    : currentPayment.status === 'partial'
                    ? 'Partial Payment'
                    : 'Payment Overdue'}
                </Text>
              </View>
              <Text style={[styles.paymentDueAmount, { color: colors.text }]}>
                ${currentPayment.remainingAmount.toFixed(0)} remaining
              </Text>
              {currentPayment.status === 'grace_period' && currentPayment.gracePeriodEnd && (
                <Text style={[styles.paymentDueGrace, { color: colors.warning }]}>
                  {(() => {
                    const endDate = new Date(currentPayment.gracePeriodEnd);
                    const now = new Date();
                    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
                    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to complete this payment`;
                  })()}
                </Text>
              )}
              {currentPayment.paidAmount > 0 && (
                <View style={styles.partialPaidRow}>
                  <View style={[styles.partialPaidBar, { backgroundColor: colors.surfaceLight }]}>
                    <View style={[
                      styles.partialPaidFill,
                      {
                        backgroundColor: colors.green,
                        width: `${Math.min(100, (currentPayment.paidAmount / (currentPayment.requiredAmount + currentPayment.carryOver)) * 100)}%` as `${number}%`,
                      }
                    ]} />
                  </View>
                  <Text style={[styles.partialPaidText, { color: colors.textSecondary }]}>
                    ${currentPayment.paidAmount.toFixed(0)} of ${(currentPayment.requiredAmount + currentPayment.carryOver).toFixed(0)} paid
                  </Text>
                </View>
              )}
              {catchUpAmount > 0 && catchUpAmount !== currentPayment.remainingAmount && (
                <Text style={[styles.catchUpText, { color: colors.textMuted }]}>
                  Total catch-up needed: ${catchUpAmount.toFixed(0)} (includes previous balance)
                </Text>
              )}
            </View>
          )}

          {!isCompleted && currentPayment && currentPayment.status === 'upcoming' && (
            <View style={[styles.upcomingPaymentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.paymentDueHeader}>
                <Clock size={16} color={colors.green} />
                <Text style={[styles.upcomingPaymentTitle, { color: colors.text }]}>Next Payment Due</Text>
              </View>
              <View style={styles.upcomingPaymentRow}>
                <Text style={[styles.upcomingPaymentAmount, { color: colors.green }]}>
                  ${(currentPayment.requiredAmount + currentPayment.carryOver).toFixed(0)}
                </Text>
                <Text style={[styles.upcomingPaymentDate, { color: colors.textMuted }]}>
                  Due {new Date(currentPayment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {currentPayment.carryOver > 0 && (
                <Text style={[styles.catchUpText, { color: colors.warning }]}>
                  Includes ${currentPayment.carryOver.toFixed(0)} carry-over from previous period
                </Text>
              )}
            </View>
          )}

          <View style={styles.disciplineRow}>
            <View style={[styles.disciplineStat, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Target size={16} color={completionRate >= 80 ? colors.green : completionRate >= 50 ? colors.warning : colors.danger} />
              <Text style={[styles.disciplineValue, { color: colors.text }]}>{completionRate}%</Text>
              <Text style={[styles.disciplineLabel, { color: colors.textMuted }]}>Discipline</Text>
            </View>
            <View style={[styles.disciplineStat, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Flame size={16} color={colors.green} />
              <Text style={[styles.disciplineValue, { color: colors.text }]}>{userContribCount}</Text>
              <Text style={[styles.disciplineLabel, { color: colors.textMuted }]}>On Time</Text>
            </View>
            <View style={[styles.disciplineStat, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <AlertTriangle size={16} color={missedDays > 0 ? colors.danger : colors.green} />
              <Text style={[styles.disciplineValue, { color: colors.text }]}>{missedDays}</Text>
              <Text style={[styles.disciplineLabel, { color: colors.textMuted }]}>Missed</Text>
            </View>
          </View>

          {!isCompleted && (
            <View style={[styles.disciplineScoreCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.disciplineScoreHeader}>
                <Text style={[styles.disciplineScoreTitle, { color: colors.text }]}>Discipline Score</Text>
                <View style={[
                  styles.disciplineBadge,
                  {
                    backgroundColor: disciplineInfo.score >= 90 ? colors.greenMuted
                      : disciplineInfo.score >= 70 ? colors.warningMuted
                      : colors.dangerMuted
                  }
                ]}>
                  <Text style={[
                    styles.disciplineBadgeText,
                    {
                      color: disciplineInfo.score >= 90 ? colors.green
                        : disciplineInfo.score >= 70 ? colors.warning
                        : colors.danger
                    }
                  ]}>{disciplineInfo.label}</Text>
                </View>
              </View>
              <View style={styles.disciplineBarWrap}>
                <AnimatedProgressBar
                  progress={disciplineInfo.score / 100}
                  color={disciplineInfo.score >= 90 ? colors.green : disciplineInfo.score >= 70 ? colors.warning : colors.danger}
                  height={6}
                />
              </View>
              <View style={styles.disciplineBreakdown}>
                <View style={styles.disciplineBreakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.breakdownText, { color: colors.textMuted }]}>{disciplineInfo.onTimeCount} on time</Text>
                </View>
                {disciplineInfo.partialCount > 0 && (
                  <View style={styles.disciplineBreakdownItem}>
                    <View style={[styles.breakdownDot, { backgroundColor: colors.warning }]} />
                    <Text style={[styles.breakdownText, { color: colors.textMuted }]}>{disciplineInfo.partialCount} partial</Text>
                  </View>
                )}
                {disciplineInfo.lateCount > 0 && (
                  <View style={styles.disciplineBreakdownItem}>
                    <View style={[styles.breakdownDot, { backgroundColor: colors.orange }]} />
                    <Text style={[styles.breakdownText, { color: colors.textMuted }]}>{disciplineInfo.lateCount} late</Text>
                  </View>
                )}
                {disciplineInfo.missedCount > 0 && (
                  <View style={styles.disciplineBreakdownItem}>
                    <View style={[styles.breakdownDot, { backgroundColor: colors.danger }]} />
                    <Text style={[styles.breakdownText, { color: colors.textMuted }]}>{disciplineInfo.missedCount} missed</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {isCompleted && (
            <View style={[styles.completedBanner, { backgroundColor: colors.greenMuted, borderColor: colors.green + '22' }]}>
              <Lock size={18} color={colors.green} />
              <View style={styles.completedBannerContent}>
                <Text style={[styles.completedBannerTitle, { color: colors.green }]}>Cycle Complete</Text>
                <Text style={[styles.completedBannerDesc, { color: colors.textMuted }]}>
                  This cycle has reached its goal. Withdrawals are no longer available.
                </Text>
              </View>
            </View>
          )}

          {isCompleted && !existingPost && (
            <TouchableOpacity
              style={[styles.shareAchievementBtn, { backgroundColor: colors.green }]}
              onPress={handleShareAchievement}
              activeOpacity={0.85}
              testID="share-achievement-cycle-btn"
            >
              <Sparkles size={18} color="#000" />
              <Text style={styles.shareAchievementText}>Share What You Achieved</Text>
            </TouchableOpacity>
          )}

          {existingPost && (
            <View style={[styles.achievedCard, { backgroundColor: colors.card, borderColor: colors.green + '22' }]}>
              <View style={styles.achievedHeader}>
                <Trophy size={16} color={colors.warning} />
                <Text style={[styles.achievedTitle, { color: colors.text }]}>Your Achievement</Text>
              </View>
              <Text style={[styles.achievedPostTitle, { color: colors.text }]}>{existingPost.title}</Text>
              {existingPost.description ? (
                <Text style={[styles.achievedPostDesc, { color: colors.textSecondary }]}>{existingPost.description}</Text>
              ) : null}
              <View style={styles.achievedMeta}>
                <Text style={[styles.achievedLikes, { color: colors.textMuted }]}>
                  {existingPost.likes.length} like{existingPost.likes.length !== 1 ? 's' : ''} · {existingPost.comments.length} comment{existingPost.comments.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}

          {pendingWithdrawals.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Withdrawals</Text>
              {pendingWithdrawals.map((req) => {
                const isMyRequest = req.requesterId === user?.id;
                const alreadyVoted = req.approvals.some(a => a.memberId === user?.id);
                return (
                  <View key={req.id} style={[styles.withdrawalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.withdrawalHeader}>
                      <Text style={[styles.withdrawalName, { color: colors.text }]}>{req.requesterName}</Text>
                      <Text style={[styles.withdrawalAmount, { color: colors.danger }]}>-${req.amount.toLocaleString()}</Text>
                    </View>
                    <Text style={[styles.withdrawalReason, { color: colors.textMuted }]}>{req.reason}</Text>
                    <Text style={[styles.withdrawalProgress, { color: colors.textSecondary }]}>
                      {req.approvals.filter(a => a.approved).length}/{req.requiredApprovals} approvals needed
                    </Text>
                    {!isMyRequest && !alreadyVoted && (
                      <View style={styles.withdrawalActions}>
                        <TouchableOpacity
                          style={[styles.approveBtn, { backgroundColor: colors.greenMuted }]}
                          onPress={() => handleApproveWithdrawal(req.id, true)}
                        >
                          <CheckCircle size={14} color={colors.green} />
                          <Text style={[styles.approveBtnText, { color: colors.green }]}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.denyBtn, { backgroundColor: colors.dangerMuted }]}
                          onPress={() => handleApproveWithdrawal(req.id, false)}
                        >
                          <XCircle size={14} color={colors.danger} />
                          <Text style={[styles.denyBtnText, { color: colors.danger }]}>Deny</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {alreadyVoted && (
                      <Text style={[styles.votedText, { color: colors.textMuted }]}>You already voted</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {graphData.length > 1 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color={typeColor} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Growth</Text>
              </View>
              <View style={[styles.graphCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <GrowthGraph data={graphData} height={140} accentColor={typeColor} />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color={typeColor} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Cycle Health</Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.healthScoreRow}>
                <View style={[styles.healthScoreCircle, {
                  borderColor: completionRate >= 90 ? colors.green : completionRate >= 70 ? colors.warning : colors.danger,
                }]}>
                  <Text style={[styles.healthScoreNum, {
                    color: completionRate >= 90 ? colors.green : completionRate >= 70 ? colors.warning : colors.danger,
                  }]}>{completionRate}</Text>
                  <Text style={[styles.healthScoreDenom, { color: colors.textMuted }]}>/100</Text>
                </View>
                <View style={styles.healthInfo}>
                  <Text style={[styles.healthLabel, {
                    color: completionRate >= 90 ? colors.green : completionRate >= 70 ? colors.warning : colors.danger,
                  }]}>
                    {completionRate >= 90 ? 'Excellent Discipline' : completionRate >= 70 ? 'Good Standing' : 'Needs Attention'}
                  </Text>
                  <Text style={[styles.healthDesc, { color: colors.textSecondary }]}>
                    Based on on-time payments, current streak, missed contributions, and goal completion
                  </Text>
                </View>
              </View>
              <View style={[styles.healthDivider, { backgroundColor: colors.border }]} />
              <View style={styles.healthFactors}>
                <View style={styles.healthFactor}>
                  <View style={[styles.healthFactorDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.healthFactorLabel, { color: colors.textSecondary }]}>On Time</Text>
                  <Text style={[styles.healthFactorVal, { color: colors.text }]}>
                    {disciplineInfo.onTimeCount}/{disciplineInfo.totalPayments}
                  </Text>
                </View>
                <View style={styles.healthFactor}>
                  <View style={[styles.healthFactorDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.healthFactorLabel, { color: colors.textSecondary }]}>Missed</Text>
                  <Text style={[styles.healthFactorVal, { color: colors.text }]}>{missedDays}</Text>
                </View>
                <View style={styles.healthFactor}>
                  <View style={[styles.healthFactorDot, { backgroundColor: colors.blue }]} />
                  <Text style={[styles.healthFactorLabel, { color: colors.textSecondary }]}>Streak</Text>
                  <Text style={[styles.healthFactorVal, { color: colors.text }]}>{user?.streak ?? 0}d</Text>
                </View>
                <View style={styles.healthFactor}>
                  <View style={[styles.healthFactorDot, { backgroundColor: colors.purple }]} />
                  <Text style={[styles.healthFactorLabel, { color: colors.textSecondary }]}>Goal</Text>
                  <Text style={[styles.healthFactorVal, { color: colors.text }]}>{Math.round(progress * 100)}%</Text>
                </View>
              </View>
            </View>
          </View>

          {(cycle.members.length > 1 || isGroupCycle) && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeader}>
                  <Users size={16} color={typeColor} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {cycle.type === 'community' ? 'Leaderboard' : 'Participants'}
                  </Text>
                  <View style={[styles.memberCountBadge, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.memberCountText, { color: colors.textSecondary }]}>{cycle.members.length}</Text>
                  </View>
                </View>
                {isGroupCycle && !isCompleted && (
                  <TouchableOpacity
                    style={[styles.addMemberSmallBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => setShowInviteModal(true)}
                    testID="invite-btn"
                  >
                    <UserPlus size={14} color={typeColor} />
                    <Text style={[styles.addMemberSmallText, { color: typeColor }]}>Invite</Text>
                  </TouchableOpacity>
                )}
              </View>

              {sortedMembers.map((member, index) => {
                const isOwner = member.role === 'owner';
                const isPending = member.inviteStatus === 'pending';

                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => handleMemberTap(member)}
                    activeOpacity={0.7}
                  >
                    {cycle.type === 'community' && (
                      <Text style={[styles.rank, { color: index === 0 ? colors.warning : colors.textSecondary }]}>#{index + 1}</Text>
                    )}
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                    ) : (
                      <View style={[styles.memberAvatarSmall, { backgroundColor: colors.surfaceLight }]}>
                        <Text style={[styles.memberAvatarInitial, { color: typeColor }]}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                        {isOwner && (
                          <View style={[styles.ownerTag, { backgroundColor: colors.greenMuted }]}>
                            <Text style={[styles.ownerTagText, { color: colors.green }]}>Owner</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.memberAmount, { color: colors.textMuted }]}>
                        ${member.totalContributed.toLocaleString()} contributed
                      </Text>
                    </View>
                    {isPending && (
                      <View style={[styles.pendingDot, { backgroundColor: colors.warningMuted }]}>
                        <Text style={[styles.pendingDotText, { color: colors.warning }]}>Pending</Text>
                      </View>
                    )}
                    {index === 0 && cycle.type === 'community' && (
                      <Trophy size={16} color={colors.warning} />
                    )}
                    <ChevronRight size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}

              {isGroupCycle && (
                <TouchableOpacity
                  style={[styles.sharePlanRow, { backgroundColor: colors.greenSoft, borderColor: colors.green + '22' }]}
                  onPress={handleSharePlan}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sharePlanIcon, { backgroundColor: colors.greenMuted }]}>
                    <Send size={14} color={colors.green} />
                  </View>
                  <View style={styles.sharePlanInfo}>
                    <Text style={[styles.sharePlanTitle, { color: colors.green }]}>Share Cycle Plan</Text>
                    <Text style={[styles.sharePlanDesc, { color: colors.textMuted }]}>Send the plan to all members</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contribution History</Text>
            {cycle.contributions.length === 0 && (
              <Text style={[styles.emptyHistory, { color: colors.textMuted }]}>No contributions yet. Start saving!</Text>
            )}
            {cycle.contributions.slice(0, 10).map((contribution) => (
              <View key={contribution.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                <View style={[
                  styles.historyDot,
                  { backgroundColor: contribution.type === 'contribution' ? colors.green : colors.danger }
                ]} />
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: colors.text }]}>{contribution.memberName}</Text>
                  <Text style={[styles.historyDate, { color: colors.textMuted }]}>{formatDate(contribution.date)}</Text>
                </View>
                <Text style={[
                  styles.historyAmount,
                  { color: contribution.type === 'contribution' ? colors.green : colors.danger }
                ]}>
                  {contribution.type === 'contribution' ? '+' : '-'}${contribution.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          {cycle.type === 'teen' && (
            <View style={[styles.teenNotice, { backgroundColor: colors.warningMuted, borderColor: colors.warning + '33' }]}>
              <AlertTriangle size={16} color={colors.warning} />
              <Text style={[styles.teenNoticeText, { color: colors.warning }]}>
                Teen Cycle — Withdrawals require parent/guardian approval
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <ContributionModal
        visible={showContribute}
        cycleName={cycle.name}
        onClose={() => setShowContribute(false)}
        onConfirm={handleContribute}
      />

      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onAdd={handleInviteMember}
        cycleType={cycle.type}
      />

      <MemberDetailSheet
        visible={showMemberDetail}
        member={selectedMember}
        isOwner={cycle.createdBy === cycle.members.find((m) => m.role === 'owner')?.id}
        onClose={() => {
          setShowMemberDetail(false);
          setSelectedMember(null);
        }}
        onResendInvite={handleResendInvite}
        onRemoveMember={handleRemoveMember}
        onUpdatePermissions={handleUpdatePermissions}
      />

      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Withdrawal Request</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Your contribution: ${userContribution.toLocaleString()}. Other members must approve this request.
            </Text>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ($)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Reason</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
              value={withdrawReason}
              onChangeText={setWithdrawReason}
              placeholder="Why do you need to withdraw?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: colors.surfaceLight }]} onPress={() => setShowWithdrawModal(false)}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: colors.danger }]} onPress={handleSubmitWithdrawal}>
                <Text style={styles.modalSubmitText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfettiCelebration
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
        onShareAchievement={handleShareAchievement}
        cycleName={cycle.name}
        goalAmount={cycle.goalAmount}
      />

      <AchievementPostModal
        visible={showAchievementPost}
        onClose={() => setShowAchievementPost(false)}
        onSubmit={handlePostAchievement}
        cycleName={cycle.name}
        goalAmount={cycle.goalAmount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cycleName: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 20,
  },
  progressSection: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
  },
  goalAmount: {
    fontSize: 14,
    marginLeft: 6,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  userContribRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  userContribLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  userContribAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  contributeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  contributeBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  withdrawBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  completedBannerContent: {
    flex: 1,
  },
  completedBannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  completedBannerDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  memberCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  addMemberSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  addMemberSmallText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  graphCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  rank: {
    fontSize: 14,
    fontWeight: '700' as const,
    width: 30,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  memberAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  ownerTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ownerTagText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  memberAmount: {
    fontSize: 12,
    marginTop: 1,
  },
  pendingDot: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  pendingDotText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  sharePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 12,
    borderWidth: 1,
  },
  sharePlanIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePlanInfo: {
    flex: 1,
  },
  sharePlanTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sharePlanDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  emptyHistory: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  historyDate: {
    fontSize: 11,
    marginTop: 1,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  teenNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  teenNoticeText: {
    fontSize: 12,
    flex: 1,
  },
  withdrawalCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  withdrawalName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  withdrawalAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  withdrawalReason: {
    fontSize: 13,
    marginBottom: 6,
  },
  withdrawalProgress: {
    fontSize: 12,
    marginBottom: 10,
  },
  withdrawalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  denyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  denyBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  votedText: {
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  backLink: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  purposeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  purposeContent: {
    flex: 1,
  },
  purposeLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 13,
    lineHeight: 18,
  },
  journeyCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journeyTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stageEmoji: {
    fontSize: 12,
  },
  stageLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  stagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stageDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLine: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  disciplineRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  disciplineStat: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  disciplineValue: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  disciplineLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  shareAchievementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  shareAchievementText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000',
  },
  achievedCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  achievedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  achievedTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  achievedPostTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  achievedPostDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  achievedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievedLikes: {
    fontSize: 12,
  },
  paymentDueCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  paymentDueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentDueTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  paymentDueAmount: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  paymentDueGrace: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  partialPaidRow: {
    gap: 4,
  },
  partialPaidBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  partialPaidFill: {
    height: 4,
    borderRadius: 2,
  },
  partialPaidText: {
    fontSize: 11,
  },
  catchUpText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  upcomingPaymentCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  upcomingPaymentTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  upcomingPaymentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  upcomingPaymentAmount: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  upcomingPaymentDate: {
    fontSize: 13,
  },
  disciplineScoreCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  disciplineScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  disciplineScoreTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  disciplineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  disciplineBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  disciplineBarWrap: {
    marginBottom: 12,
  },
  disciplineBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  disciplineBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breakdownText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  healthCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  healthScoreRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 12,
  },
  healthScoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  healthScoreNum: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  healthScoreDenom: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginTop: -2,
  },
  healthInfo: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  healthDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  healthDivider: {
    height: 1,
    marginBottom: 12,
  },
  healthFactors: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  healthFactor: {
    alignItems: 'center' as const,
    gap: 4,
  },
  healthFactorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthFactorLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  healthFactorVal: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
});
