import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Settings, ChevronRight, LogOut, HelpCircle, Layers, FileText, Building2, ShieldAlert, Star, Flame, Trophy, Shield, Bell, Lock, Unlock, Palette, Wifi, Camera, BadgeCheck, CreditCard, Target, ShieldBan, Users } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useCycles } from '@/providers/CyclesProvider';
import { useCard } from '@/providers/CardProvider';
import { Badge } from '@/types';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import { supabase } from '@/lib/supabase';

function getBadgeIcon(iconName: string, earned: boolean, colors: { green: string; textMuted: string }) {
  const color = earned ? colors.green : colors.textMuted;
  const size = 24;
  switch (iconName) {
    case 'star': return <Star size={size} color={color} />;
    case 'flame': return <Flame size={size} color={color} />;
    case 'trophy': return <Trophy size={size} color={color} />;
    default: return <Star size={size} color={color} />;
  }
}

interface BadgeWithProgress extends Badge {
  progress?: number;
  target?: number;
  current?: number;
}

function BadgeItem({ badge, colors }: { badge: BadgeWithProgress; colors: ReturnType<typeof useTheme>['colors'] }) {
  const progress = badge.progress ?? (badge.earned ? 1 : 0);
  return (
    <View style={badgeStyles.container}>
      <View style={[
        badgeStyles.iconWrap,
        badge.earned
          ? { backgroundColor: colors.greenMuted, borderWidth: 1, borderColor: colors.green + '44' }
          : { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border }
      ]}>
        {getBadgeIcon(badge.icon, badge.earned, colors)}
      </View>
      <Text style={[badgeStyles.name, { color: badge.earned ? colors.text : colors.textMuted }]} numberOfLines={2}>{badge.name}</Text>
      {!badge.earned && badge.target && badge.current !== undefined && (
        <View style={badgeStyles.progressWrap}>
          <AnimatedProgressBar progress={progress} color={colors.green} height={3} />
          <Text style={[badgeStyles.progressText, { color: colors.textMuted }]}>{badge.current}/{badge.target}</Text>
        </View>
      )}
      {badge.earned && (
        <View style={[badgeStyles.earnedDot, { backgroundColor: colors.green }]} />
      )}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: '600' as const,
    textAlign: 'center',
    lineHeight: 14,
  },
  progressWrap: {
    width: '100%',
    marginTop: 6,
    gap: 2,
  },
  progressText: {
    fontSize: 9,
    textAlign: 'center',
  },
  earnedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logOut, updateAvatar } = useAuth();
  const { activeCycles, cycles, completedCycles, totalSaved: _totalSaved, getDisciplineInfo } = useCycles();
  const { colors } = useTheme();
  const { settings: cardSettings, currentTheme, toggleCardLock } = useCard();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const userCountQuery = useQuery({
    queryKey: ['zivo-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_signups')
        .select('*', { count: 'exact', head: true });
      if (error) {
        console.log('[Profile] Failed to fetch user count:', error.message);
        return 0;
      }
      return count ?? 0;
    },
    staleTime: 60_000,
  });
  const totalUsers = userCountQuery.data ?? 0;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        updateAvatar(uri);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('[Profile] Avatar updated');
      }
    } catch (error) {
      console.log('[Profile] Image picker error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Could not open image picker');
      }
    }
  }, [updateAvatar]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            void logOut();
          },
        },
      ]
    );
  }, [logOut]);

  const handleNav = useCallback((path: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as never);
  }, [router]);

  const handleToggleCardLock = useCallback(() => {
    const isNowLocked = toggleCardLock();
    void Haptics.notificationAsync(
      isNowLocked ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );
    Alert.alert(
      isNowLocked ? 'Card Locked' : 'Card Unlocked',
      isNowLocked
        ? 'Your card has been locked. No transactions can be made.'
        : 'Your card is now active and ready to use.'
    );
  }, [toggleCardLock]);

  const firstName = user?.name?.split(' ')[0] ?? '';
  const isTeen = user?.accountType === 'teen';
  const parentStatus = user?.parentApprovalStatus;
  const streak = user?.streak ?? 0;
  const disciplineInfo = useMemo(() => getDisciplineInfo(), [getDisciplineInfo]);
  const accentColor = currentTheme.accent.replace(/[\d.]+\)$/, '1)');

  const rawBadges = useMemo(() => user?.badges ?? [], [user?.badges]);

  const totalContributions = useMemo(() => {
    let count = 0;
    for (const c of cycles) {
      for (const contrib of c.contributions) {
        if (contrib.memberId === user?.id && contrib.type === 'contribution') count++;
      }
    }
    return count;
  }, [cycles, user?.id]);

  const badges: BadgeWithProgress[] = useMemo(() => {
    return rawBadges.slice(0, 3).map(b => {
      switch (b.id) {
        case '1': return { ...b, earned: totalContributions >= 1, progress: Math.min(totalContributions / 1, 1), target: 1, current: Math.min(totalContributions, 1) };
        case '2': return { ...b, earned: streak >= 7, progress: Math.min(streak / 7, 1), target: 7, current: Math.min(streak, 7) };
        case '3': {
          const completed = cycles.filter(c => c.status === 'completed').length;
          return { ...b, earned: completed >= 1, progress: Math.min(completed / 1, 1), target: 1, current: Math.min(completed, 1) };
        }
        default: return b;
      }
    });
  }, [rawBadges, totalContributions, streak, cycles]);

  const allBadgesEarned = useMemo(() => badges.length > 0 && badges.every(b => b.earned), [badges]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>
            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: colors.card }]}
              onPress={() => handleNav('/settings')}
              testID="settings-btn"
            >
              <Settings size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickImage}
              activeOpacity={0.8}
              testID="change-avatar-btn"
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.green }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
                  <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>{firstName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={[styles.cameraOverlay, { backgroundColor: colors.green, borderColor: colors.background }]}>
                <Camera size={14} color={colors.background} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name ?? 'User'}</Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email ?? ''}</Text>
            {isTeen && (
              <View style={[styles.teenBadge, { backgroundColor: colors.warningMuted }]}>
                <ShieldAlert size={12} color={colors.warning} />
                <Text style={[styles.teenBadgeText, { color: colors.warning }]}>Teen Account</Text>
              </View>
            )}
          </View>

          {isTeen && parentStatus !== 'approved' && (
            <TouchableOpacity
              style={[styles.approvalBanner, { backgroundColor: colors.warningMuted, borderColor: colors.warning + '22' }]}
              onPress={() => handleNav('/parent-approval')}
              activeOpacity={0.7}
            >
              <ShieldAlert size={20} color={colors.warning} />
              <View style={styles.approvalBannerContent}>
                <Text style={[styles.approvalBannerTitle, { color: colors.warning }]}>
                  {parentStatus === 'pending' ? 'Approval Pending' : 'Parent Approval Required'}
                </Text>
                <Text style={[styles.approvalBannerText, { color: colors.textMuted }]}>
                  {parentStatus === 'pending' ? 'Waiting for your parent to approve' : 'Tap to request parent approval'}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.warning} />
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>STREAK</Text>
              <Text style={[styles.statCardValue, { color: colors.text }]}>{streak} Days</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>DISCIPLINE</Text>
              <Text style={[styles.statCardValue, {
                color: disciplineInfo.score >= 90 ? colors.green
                  : disciplineInfo.score >= 70 ? colors.warning
                  : colors.danger
              }]}>{disciplineInfo.score}%</Text>
            </View>
          </View>

          {totalUsers > 0 && (
            <View style={[styles.communityCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.communityIconWrap, { backgroundColor: colors.greenMuted }]}>
                <Users size={20} color={colors.green} />
              </View>
              <View style={styles.communityContent}>
                <Text style={[styles.communityCount, { color: colors.green }]}>{totalUsers.toLocaleString()}</Text>
                <Text style={[styles.communityLabel, { color: colors.textMuted }]}>
                  {totalUsers === 1 ? 'person using Zivo' : 'people using Zivo'}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.disciplineDetailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.disciplineDetailHeader}>
              <Text style={[styles.disciplineDetailTitle, { color: colors.text }]}>Discipline Breakdown</Text>
              <View style={[
                styles.disciplineDetailBadge,
                {
                  backgroundColor: disciplineInfo.score >= 90 ? colors.greenMuted
                    : disciplineInfo.score >= 70 ? colors.warningMuted
                    : colors.dangerMuted
                }
              ]}>
                <Text style={[
                  styles.disciplineDetailBadgeText,
                  {
                    color: disciplineInfo.score >= 90 ? colors.green
                      : disciplineInfo.score >= 70 ? colors.warning
                      : colors.danger
                  }
                ]}>{disciplineInfo.label}</Text>
              </View>
            </View>
            <AnimatedProgressBar
              progress={disciplineInfo.score / 100}
              color={disciplineInfo.score >= 90 ? colors.green : disciplineInfo.score >= 70 ? colors.warning : colors.danger}
              height={5}
            />
            <View style={styles.disciplineDetailStats}>
              <View style={styles.disciplineDetailStat}>
                <Text style={[styles.disciplineDetailStatVal, { color: colors.green }]}>{disciplineInfo.onTimeCount}</Text>
                <Text style={[styles.disciplineDetailStatLabel, { color: colors.textMuted }]}>On Time</Text>
              </View>
              {disciplineInfo.partialCount > 0 && (
                <View style={styles.disciplineDetailStat}>
                  <Text style={[styles.disciplineDetailStatVal, { color: colors.warning }]}>{disciplineInfo.partialCount}</Text>
                  <Text style={[styles.disciplineDetailStatLabel, { color: colors.textMuted }]}>Partial</Text>
                </View>
              )}
              <View style={styles.disciplineDetailStat}>
                <Text style={[styles.disciplineDetailStatVal, { color: colors.danger }]}>{disciplineInfo.missedCount}</Text>
                <Text style={[styles.disciplineDetailStatLabel, { color: colors.textMuted }]}>Missed</Text>
              </View>
              <View style={styles.disciplineDetailStat}>
                <Text style={[styles.disciplineDetailStatVal, { color: colors.text }]}>{activeCycles.length}</Text>
                <Text style={[styles.disciplineDetailStatLabel, { color: colors.textMuted }]}>Active</Text>
              </View>
            </View>
          </View>

          <View style={styles.achievementsSection}>
            <View style={styles.achievementsTitleRow}>
              <Text style={[styles.achievementsTitle, { color: colors.textMuted }]}>ACHIEVEMENTS</Text>
              <Text style={[styles.achievementsCount, { color: colors.green }]}>
                {badges.filter(b => b.earned).length}/{badges.length}
              </Text>
            </View>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <BadgeItem key={badge.id} badge={badge} colors={colors} />
              ))}
            </View>
          </View>

          <View style={styles.verificationSection}>
            <Text style={[styles.achievementsTitle, { color: colors.textMuted }]}>VERIFICATION</Text>
            <View style={styles.verifBadgesGrid}>
              <VerifBadge icon="id" label="Identity" earned={false} colors={colors} />
              <VerifBadge icon="bank" label="Bank" earned={false} colors={colors} />
              <VerifBadge icon="saver" label="Saver" earned={allBadgesEarned} colors={colors} />
              <VerifBadge icon="elite" label="Elite" earned={(completedCycles?.length ?? 0) >= 10} colors={colors} />
            </View>
          </View>

          <View style={[styles.zivoCard, { backgroundColor: currentTheme.primary, borderColor: currentTheme.accent }]}>
            {cardSettings.isLocked && (
              <View style={styles.cardLockedOverlay}>
                <Lock size={28} color="rgba(255,255,255,0.6)" />
                <Text style={styles.cardLockedText}>Card Locked</Text>
              </View>
            )}
            <View style={styles.cardChip} />
            <View style={styles.cardContactless}>
              <Wifi size={16} color="rgba(255,255,255,0.5)" />
            </View>
            <View style={styles.zivoCardHeader}>
              <Text style={[styles.zivoCardLogo, { color: accentColor }]}>ZIVO</Text>
              <Text style={styles.cardTypeLabel}>DEBIT</Text>
            </View>
            <View style={styles.zivoCardNumber}>
              <Text style={styles.cardDots}>****  ****  ****  </Text>
              <Text style={styles.cardLast4}>4289</Text>
            </View>
            <View style={styles.zivoCardFooter}>
              <View>
                <Text style={styles.cardLabel}>CARD HOLDER</Text>
                <Text style={styles.cardValue}>{user?.name?.toUpperCase() ?? 'USER'}</Text>
              </View>
              <View style={styles.cardFooterRight}>
                <View>
                  <Text style={styles.cardLabel}>VALID THRU</Text>
                  <Text style={styles.cardValue}>12/28</Text>
                </View>
                <View style={styles.cardNetwork}>
                  <View style={styles.cardNetworkCircle1} />
                  <View style={styles.cardNetworkCircle2} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.cardActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleToggleCardLock}
              activeOpacity={0.7}
            >
              {cardSettings.isLocked ? (
                <Unlock size={16} color={colors.green} />
              ) : (
                <Lock size={16} color={colors.warning} />
              )}
              <Text style={[styles.cardActionText, { color: cardSettings.isLocked ? colors.green : colors.warning }]}>
                {cardSettings.isLocked ? 'Unlock' : 'Lock'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cardActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => handleNav('/card-customize')}
              activeOpacity={0.7}
            >
              <Palette size={16} color={colors.blue} />
              <Text style={[styles.cardActionText, { color: colors.blue }]}>Customize</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSection}>
            <MenuItem
              icon={<Building2 size={18} color={colors.textSecondary} />}
              label="Payment Methods"
              subtitle="Apple Pay, Debit Card"
              onPress={() => handleNav('/payment-methods')}
              colors={colors}
            />
            <MenuItem
              icon={<Bell size={18} color={colors.textSecondary} />}
              label="Notifications"
              subtitle="Streaks, Milestones"
              onPress={() => handleNav('/(tabs)/activity')}
              colors={colors}
            />
            <MenuItem
              icon={<Shield size={18} color={colors.textSecondary} />}
              label="Security"
              subtitle="FaceID, Passcode"
              onPress={() => handleNav('/security-setup')}
              colors={colors}
            />
            <MenuItem
              icon={<HelpCircle size={18} color={colors.textSecondary} />}
              label="Help & Support"
              subtitle="Get help with your account"
              onPress={() => handleNav('/support')}
              colors={colors}
            />
          </View>

          <View style={styles.menuSection}>
            <MenuItem
              icon={<Layers size={18} color={colors.textSecondary} />}
              label="Privacy Policy"
              onPress={() => handleNav('/privacy')}
              colors={colors}
            />
            <MenuItem
              icon={<FileText size={18} color={colors.textSecondary} />}
              label="Terms of Service"
              onPress={() => handleNav('/terms')}
              colors={colors}
            />
          </View>

          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.dangerMuted, borderColor: colors.danger + '33' }]} onPress={handleLogout}>
            <LogOut size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function VerifBadge({ icon, label, earned, colors }: { icon: string; label: string; earned: boolean; colors: ReturnType<typeof useTheme>['colors'] }) {
  const getIcon = () => {
    const c = earned ? colors.green : colors.textMuted;
    switch (icon) {
      case 'id': return <Shield size={18} color={c} />;
      case 'bank': return <CreditCard size={18} color={c} />;
      case 'saver': return <BadgeCheck size={18} color={c} />;
      case 'elite': return <Trophy size={18} color={c} />;
      default: return <Shield size={18} color={c} />;
    }
  };
  return (
    <View style={verifBadgeStyles.item}>
      <View style={[
        verifBadgeStyles.icon,
        earned
          ? { backgroundColor: colors.greenMuted, borderColor: colors.green + '33', borderWidth: 1 }
          : { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 }
      ]}>
        {getIcon()}
      </View>
      <Text style={[verifBadgeStyles.label, { color: earned ? colors.green : colors.textMuted }]}>{label}</Text>
      {earned && <View style={[verifBadgeStyles.dot, { backgroundColor: colors.green }]} />}
    </View>
  );
}

const verifBadgeStyles = StyleSheet.create({
  item: { alignItems: 'center', gap: 6 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '600' as const },
  dot: { width: 5, height: 5, borderRadius: 3 },
});

function MenuItem({ icon, label, subtitle, onPress, colors }: { icon: React.ReactNode; label: string; subtitle?: string; onPress: () => void; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <TouchableOpacity
      style={[menuItemStyles.item, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[menuItemStyles.iconContainer, { backgroundColor: colors.surfaceLight }]}>{icon}</View>
      <View style={menuItemStyles.labelContainer}>
        <Text style={[menuItemStyles.label, { color: colors.text }]}>{label}</Text>
        {subtitle && <Text style={[menuItemStyles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const menuItemStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 2,
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  name: {
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  teenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  teenBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
  },
  approvalBannerContent: {
    flex: 1,
  },
  approvalBannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  approvalBannerText: {
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },
  communityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityContent: {
    flex: 1,
  },
  communityCount: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  communityLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  achievementsTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  achievementsCount: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  zivoCard: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  cardLockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLockedText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  cardChip: {
    position: 'absolute',
    top: 56,
    left: 22,
    width: 36,
    height: 26,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  cardContactless: {
    position: 'absolute',
    top: 58,
    left: 66,
    transform: [{ rotate: '90deg' }],
  },
  zivoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  zivoCardLogo: {
    fontSize: 20,
    fontWeight: '900' as const,
    letterSpacing: 3,
  },
  cardTypeLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 2,
  },
  zivoCardNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardDots: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 18,
    fontWeight: '500' as const,
    letterSpacing: 3,
  },
  cardLast4: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 3,
  },
  zivoCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardFooterRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 8,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 3,
  },
  cardValue: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  cardNetwork: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cardNetworkCircle1: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(235, 80, 60, 0.7)',
  },
  cardNetworkCircle2: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 170, 0, 0.7)',
    marginLeft: -8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  menuSection: {
    marginBottom: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  disciplineDetailCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  disciplineDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disciplineDetailTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  disciplineDetailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  disciplineDetailBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  disciplineDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  disciplineDetailStat: {
    alignItems: 'center',
    gap: 2,
  },
  disciplineDetailStatVal: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  disciplineDetailStatLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
  },
  verifiedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedContent: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  verifiedDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  verifiedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
  },
  verifiedHintText: {
    fontSize: 12,
    flex: 1,
  },
  verificationSection: {
    marginBottom: 24,
  },
  verifBadgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
});
