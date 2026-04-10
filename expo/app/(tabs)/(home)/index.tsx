import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Plus, Flame, Lock, Clock, Users, Target, ChevronRight, Calendar, Trophy, Zap, ArrowUpRight, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useCycles } from '@/providers/CyclesProvider';
import { useAuth } from '@/providers/AuthProvider';
import GrowthGraph from '@/components/GrowthGraph';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import { GraphDataPoint, Contribution, Cycle } from '@/types';

function buildUserOnlyGraphData(cycles: { contributions: Contribution[] }[], userId: string): GraphDataPoint[] {
  const userContributions: Contribution[] = [];
  for (const cycle of cycles) {
    for (const c of cycle.contributions) {
      if (c.memberId === userId) {
        userContributions.push(c);
      }
    }
  }

  userContributions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (userContributions.length === 0) return [];

  let running = 0;
  return userContributions.map((c) => {
    const isWithdrawal = c.type === 'withdrawal';
    if (!isWithdrawal) running += c.amount;
    else running = Math.max(0, running - c.amount);
    return {
      date: c.date,
      amount: running,
      type: isWithdrawal ? 'withdrawal' as const : 'deposit' as const,
      changeAmount: c.amount,
    };
  });
}

function getNextContributionTime(): string {
  const now = new Date();
  const today6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  if (now < today6pm) return 'Today · 6PM';
  return 'Tomorrow · 6PM';
}

function formatEndDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCommittedMembers(cycles: Cycle[]): { id: string; name: string; avatar: string }[] {
  const seen = new Set<string>();
  const members: { id: string; name: string; avatar: string }[] = [];
  for (const cycle of cycles) {
    for (const m of cycle.members) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        members.push({ id: m.id, name: m.name, avatar: m.avatar });
      }
    }
  }
  return members;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { cycles, activeCycles, completedCycles, totalSaved, getDisciplineInfo } = useCycles();
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreateCycle = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-cycle');
  }, [router]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const graphData = useMemo(() => buildUserOnlyGraphData(cycles, user?.id ?? ''), [cycles, user?.id]);
  const streak = user?.streak ?? 0;
  const disciplineInfo = useMemo(() => getDisciplineInfo(), [getDisciplineInfo]);
  const disciplineScore = disciplineInfo.score;
  const hasAnyData = graphData.length > 0;
  const hasActiveCycles = activeCycles.length > 0;



  const goalTotal = activeCycles.reduce((sum, c) => sum + c.goalAmount, 0);
  const endDateStr = activeCycles.length > 0
    ? formatEndDate(activeCycles.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0].endDate)
    : '';

  const primaryCycle = activeCycles.length > 0 ? activeCycles[0] : null;
  const primaryDaysTotal = primaryCycle ? Math.max(1, Math.ceil((new Date(primaryCycle.endDate).getTime() - new Date(primaryCycle.startDate).getTime()) / 86400000)) : 0;
  const primaryDaysElapsed = primaryCycle ? Math.max(0, Math.ceil((Date.now() - new Date(primaryCycle.startDate).getTime()) / 86400000)) : 0;
  const primaryDailyTarget = primaryCycle ? primaryCycle.goalAmount / primaryDaysTotal : 0;
  const primaryProgress = primaryDaysTotal > 0 ? Math.min(primaryDaysElapsed / primaryDaysTotal, 1) : 0;

  const committedMembers = useMemo(() => getCommittedMembers(cycles), [cycles]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <Text style={[styles.brandName, { color: colors.text }]}>Zivo, <Text style={{ color: colors.green }}>{firstName}</Text></Text>
            <TouchableOpacity
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
              testID="header-avatar"
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.headerAvatarText, { color: colors.textSecondary }]}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.graphCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <GrowthGraph
              data={graphData}
              height={180}
              accentColor={isDark ? colors.green : colors.greenDark}
              showLabels={true}
              showDots={true}
              title="Your Growth"
              interactive={hasAnyData}
              placeholder={!hasAnyData}
            />
          </View>

          {!hasActiveCycles && !hasAnyData && (
            <>
              <View style={[styles.motivationCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={[styles.motivationIconWrap, { backgroundColor: colors.greenMuted }]}>
                  <Zap size={20} color={colors.green} />
                </View>
                <View style={styles.motivationTextWrap}>
                  <Text style={[styles.motivationTitle, { color: colors.text }]}>Start building your discipline</Text>
                  <Text style={[styles.motivationDesc, { color: colors.textMuted }]}>
                    Create your first cycle and watch your savings grow
                  </Text>
                </View>
              </View>

              <View style={styles.previewRow}>
                <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.previewIconWrap, { backgroundColor: colors.greenMuted }]}>
                    <Trophy size={16} color={colors.green} />
                  </View>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>3 Achievements</Text>
                  <Text style={[styles.previewDesc, { color: colors.textMuted }]}>Unlock badges</Text>
                </View>
                <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.previewIconWrap, { backgroundColor: colors.greenMuted }]}>
                    <ArrowUpRight size={16} color={colors.green} />
                  </View>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>Track Growth</Text>
                  <Text style={[styles.previewDesc, { color: colors.textMuted }]}>See progress live</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.createCycleBtn, { backgroundColor: colors.green }]}
                onPress={handleCreateCycle}
                activeOpacity={0.85}
                testID="empty-create-cycle-btn"
              >
                <Plus size={18} color="#000" />
                <Text style={styles.createCycleBtnText}>Create New Cycle</Text>
              </TouchableOpacity>

              <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.tipsTitle, { color: colors.textSecondary }]}>Quick Tips</Text>
                <View style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.tipText, { color: colors.textMuted }]}>Add money daily to build your streak</Text>
                </View>
                <View style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.tipText, { color: colors.textMuted }]}>Invite others for group cycles</Text>
                </View>
                <View style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.tipText, { color: colors.textMuted }]}>Complete all achievements for verification</Text>
                </View>
              </View>
            </>
          )}

          {!hasActiveCycles && hasAnyData && (
            <>
              <TouchableOpacity
                style={[styles.lockedSavingsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                activeOpacity={0.8}
              >
                <View style={styles.lockedSavingsLeft}>
                  <Text style={[styles.lockedSavingsAmount, { color: colors.text }]}>
                    ${totalSaved.toLocaleString()}
                  </Text>
                  <Text style={[styles.lockedSavingsLabel, { color: colors.textMuted }]}>Total Saved</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {completedCycles.length > 0 && (
                <View style={[styles.completedBanner, { backgroundColor: colors.greenMuted, borderColor: colors.green + '20' }]}>
                  <Trophy size={16} color={colors.green} />
                  <Text style={[styles.completedBannerText, { color: colors.green }]}>
                    {completedCycles.length} cycle{completedCycles.length !== 1 ? 's' : ''} completed
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.createCycleBtn, { backgroundColor: colors.green }]}
                onPress={handleCreateCycle}
                activeOpacity={0.85}
                testID="create-cycle-btn-post"
              >
                <Plus size={18} color="#000" />
                <Text style={styles.createCycleBtnText}>Start New Cycle</Text>
              </TouchableOpacity>

              {streak > 0 && (
                <View style={styles.streakRow}>
                  <Flame size={18} color={colors.green} />
                  <Text style={[styles.disciplineVal, { color: colors.text }]}>{streak}-Day Streak</Text>
                  <Text style={[styles.committedWith, { color: colors.textMuted }]}>Keep it up!</Text>
                </View>
              )}
            </>
          )}

          {hasActiveCycles && (
            <>
              {goalTotal > 0 && (
                <View style={styles.goalRow}>
                  <Target size={14} color={colors.green} />
                  <Text style={styles.goalText}>
                    <Text style={{ color: colors.green, fontWeight: '700' as const }}>Goal: ${goalTotal.toLocaleString()}</Text>
                    {endDateStr ? <Text style={{ color: colors.textMuted }}> Ends {endDateStr}</Text> : null}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.lockedSavingsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => {
                  if (primaryCycle) {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/cycle/${primaryCycle.id}`);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.lockedSavingsLeft}>
                  <Text style={[styles.lockedSavingsAmount, { color: colors.text }]}>
                    ${totalSaved.toLocaleString()}
                  </Text>
                  <Text style={[styles.lockedSavingsLabel, { color: colors.textMuted }]}>Locked</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {primaryCycle && (
                <TouchableOpacity
                  style={[styles.cycleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/cycle/${primaryCycle.id}`);
                  }}
                  activeOpacity={0.8}
                  testID={`cycle-card-${primaryCycle.id}`}
                >
                  <View style={styles.cycleCardTop}>
                    <View style={styles.cycleCardTopLeft}>
                      <Text style={[styles.cycleName, { color: colors.text }]}>
                        {primaryDaysTotal}-Day Discipline Cycle
                      </Text>
                      <Text style={[styles.cycleDailyTarget, { color: colors.text }]}>
                        ${primaryDailyTarget.toFixed(0)}<Text style={{ color: colors.textMuted, fontSize: 13 }}>/day</Text>
                      </Text>
                      <Text style={[styles.cycleEndDate, { color: colors.textMuted }]}>
                        Cycle ends: {formatEndDate(primaryCycle.endDate)}
                      </Text>
                    </View>
                    <View style={styles.cycleCardTopRight}>
                      {primaryCycle.members.length > 1 && (
                        <View style={styles.memberAvatarStack}>
                          {primaryCycle.members.slice(0, 3).map((m, i) => (
                            <View key={m.id} style={[styles.stackedAvatar, i > 0 && { marginLeft: -10 }]}>
                              {m.avatar ? (
                                <Image source={{ uri: m.avatar }} style={styles.stackedAvatarImg} />
                              ) : (
                                <View style={[styles.stackedAvatarPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                                  <Text style={[styles.stackedAvatarText, { color: colors.textMuted }]}>{m.name.charAt(0)}</Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                      <View style={styles.memberCountRow}>
                        <Users size={12} color={colors.textMuted} />
                        <Text style={[styles.memberCountText, { color: colors.textMuted }]}>{primaryCycle.members.length} members</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.progressBarSection}>
                    <AnimatedProgressBar progress={primaryProgress} color={colors.green} height={5} />
                    <View style={styles.progressLabels}>
                      <Text style={[styles.progressDays, { color: colors.textMuted }]}>
                        {Math.min(primaryDaysElapsed, primaryDaysTotal)} / {primaryDaysTotal} days
                      </Text>
                      <View style={styles.lockedBadge}>
                        <Lock size={10} color={colors.textMuted} />
                        <Text style={[styles.lockedBadgeText, { color: colors.textMuted }]}>Locked</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cycleInfoRows}>
                    <View style={styles.cycleInfoRow}>
                      <Calendar size={13} color={colors.textMuted} />
                      <Text style={[styles.cycleInfoText, { color: colors.textMuted }]}>
                        Cycle ends: {formatEndDate(primaryCycle.endDate)}
                      </Text>
                    </View>
                    <View style={styles.cycleInfoRow}>
                      <Lock size={13} color={colors.textMuted} />
                      <Text style={[styles.cycleInfoText, { color: colors.textMuted }]}>
                        Withdrawals: Locked
                      </Text>
                    </View>
                    <View style={styles.cycleInfoRow}>
                      <Clock size={13} color={colors.textMuted} />
                      <Text style={[styles.cycleInfoText, { color: colors.textMuted }]}>
                        Next contribution: {getNextContributionTime()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.disciplineGrid}>
                <View style={[styles.disciplineCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Flame size={18} color={colors.green} />
                  <Text style={[styles.disciplineVal, { color: colors.text }]}>{streak}</Text>
                  <Text style={[styles.disciplineLbl, { color: colors.textMuted }]}>Day Streak</Text>
                </View>
                <View style={[styles.disciplineCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <BarChart3 size={18} color={
                    disciplineScore >= 90 ? colors.green
                      : disciplineScore >= 70 ? colors.warning
                      : colors.danger
                  } />
                  <Text style={[styles.disciplineVal, { color: colors.text }]}>{disciplineScore}%</Text>
                  <Text style={[styles.disciplineLbl, {
                    color: disciplineScore >= 90 ? colors.green
                      : disciplineScore >= 70 ? colors.warning
                      : colors.danger
                  }]}>{disciplineInfo.label}</Text>
                </View>
                <View style={[styles.disciplineCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Trophy size={18} color={completedCycles.length > 0 ? colors.warning : colors.textMuted} />
                  <Text style={[styles.disciplineVal, { color: colors.text }]}>{completedCycles.length}</Text>
                  <Text style={[styles.disciplineLbl, { color: colors.textMuted }]}>Completed</Text>
                </View>
              </View>

              {committedMembers.length > 1 && (
                <View style={styles.streakRow}>
                  <Text style={[styles.committedWith, { color: colors.textMuted }]}>Committed with</Text>
                  <View style={styles.streakRight}>
                    {committedMembers.slice(0, 4).map((m, i) => (
                      <View key={m.id} style={[styles.streakAvatar, i > 0 && { marginLeft: -8 }]}>
                        {m.avatar ? (
                          <Image source={{ uri: m.avatar }} style={styles.streakAvatarImg} />
                        ) : (
                          <View style={[styles.streakAvatarPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                            <Text style={{ color: colors.textMuted, fontSize: 8 }}>{m.name.charAt(0)}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                    {committedMembers.length > 4 && (
                      <View style={[styles.streakAvatar, { marginLeft: -8, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' as const }}>+{committedMembers.length - 4}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.createCycleBtn, { backgroundColor: colors.green }]}
                onPress={handleCreateCycle}
                activeOpacity={0.85}
                testID="start-commitment-btn"
              >
                <Plus size={18} color="#000000" />
                <Text style={[styles.createCycleBtnText, { color: '#000000' }]}>Start New Commitment</Text>
              </TouchableOpacity>

              {activeCycles.length > 1 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Other Active Cycles</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/cycles')} hitSlop={8}>
                      <Text style={[styles.viewAllText, { color: colors.textMuted }]}>View All</Text>
                    </TouchableOpacity>
                  </View>

                  {activeCycles.slice(1, 4).map((cycle) => {
                    const daysTotal = Math.max(1, Math.ceil((new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / 86400000));
                    const daysElapsed = Math.max(0, Math.ceil((Date.now() - new Date(cycle.startDate).getTime()) / 86400000));

                    return (
                      <TouchableOpacity
                        key={cycle.id}
                        style={[styles.smallCycleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/cycle/${cycle.id}`);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.smallCycleRow}>
                          <Text style={[styles.smallCycleName, { color: colors.text }]} numberOfLines={1}>{cycle.name}</Text>
                          <Text style={[styles.smallCycleDays, { color: colors.textMuted }]}>{Math.min(daysElapsed, daysTotal)}/{daysTotal}d</Text>
                        </View>
                        <AnimatedProgressBar progress={Math.min(daysElapsed / daysTotal, 1)} color={colors.green} height={3} />
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  graphCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  motivationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationTextWrap: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  motivationDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  previewCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  previewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  previewDesc: {
    fontSize: 11,
  },
  createCycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  createCycleBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  tipsCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  completedBannerText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  goalText: {
    fontSize: 14,
  },
  lockedSavingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  lockedSavingsLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  lockedSavingsAmount: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  lockedSavingsLabel: {
    fontSize: 14,
  },
  cycleCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  cycleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cycleCardTopLeft: {
    flex: 1,
  },
  cycleName: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  cycleDailyTarget: {
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  cycleEndDate: {
    fontSize: 12,
  },
  cycleCardTopRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  memberAvatarStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0C0E14',
    overflow: 'hidden',
  },
  stackedAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  stackedAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedAvatarText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 11,
  },
  progressBarSection: {
    marginBottom: 14,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressDays: {
    fontSize: 12,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedBadgeText: {
    fontSize: 11,
  },
  cycleInfoRows: {
    gap: 8,
  },
  cycleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleInfoText: {
    fontSize: 12,
  },
  disciplineGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  disciplineCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  disciplineVal: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  disciplineLbl: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  committedWith: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingVertical: 8,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#0C0E14',
    overflow: 'hidden',
  },
  streakAvatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  streakAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  smallCycleCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  smallCycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  smallCycleName: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  smallCycleDays: {
    fontSize: 12,
  },
});
