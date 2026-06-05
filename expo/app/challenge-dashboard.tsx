import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Trophy, Flame, Target, Users, Clock, Shield, TrendingUp, Star, Medal } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useChallenges } from '@/providers/ChallengesProvider';
import { ChallengeMember } from '@/types';

const MOCK_CHALLENGE_MEMBERS: ChallengeMember[] = [
  { id: 'm1', name: 'Sarah K.', avatar: '', streak: 12, amountSaved: 450, rank: 1, daysRemaining: 18, verificationBadges: ['saver'] },
  { id: 'm2', name: 'Marcus J.', avatar: '', streak: 8, amountSaved: 320, rank: 2, daysRemaining: 22, verificationBadges: [] },
  { id: 'm3', name: 'You', avatar: '', streak: 5, amountSaved: 175, rank: 3, daysRemaining: 25, verificationBadges: [] },
  { id: 'm4', name: 'Lena W.', avatar: '', streak: 3, amountSaved: 90, rank: 4, daysRemaining: 27, verificationBadges: ['saver', 'elite'] },
  { id: 'm5', name: 'Dev M.', avatar: '', streak: 7, amountSaved: 260, rank: 5, daysRemaining: 23, verificationBadges: ['saver'] },
];

function MemberRow({ member, colors, isCurrentUser }: { member: ChallengeMember; colors: ReturnType<typeof useTheme>['colors']; isCurrentUser: boolean }) {
  return (
    <View style={[memberRowStyles.row, isCurrentUser && { backgroundColor: colors.greenMuted, borderRadius: 12 }]}>
      <Text style={[memberRowStyles.rank, { color: member.rank <= 3 ? colors.green : colors.textMuted }]}>#{member.rank}</Text>
      <View style={[memberRowStyles.avatar, { backgroundColor: colors.surfaceLight }]}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={memberRowStyles.avatarImg} />
        ) : (
          <Text style={[memberRowStyles.avatarText, { color: colors.textMuted }]}>{member.name.charAt(0)}</Text>
        )}
      </View>
      <View style={memberRowStyles.info}>
        <View style={memberRowStyles.nameRow}>
          <Text style={[memberRowStyles.name, { color: colors.text }]}>{member.name}</Text>
          {member.verificationBadges.length > 0 && (
            <View style={memberRowStyles.verifRow}>
              {member.verificationBadges.includes('saver') && <Shield size={10} color={colors.green} />}
              {member.verificationBadges.includes('elite') && <Medal size={10} color={colors.warning} />}
            </View>
          )}
        </View>
        <View style={memberRowStyles.statsRow}>
          <View style={memberRowStyles.stat}>
            <Flame size={11} color={colors.warning} />
            <Text style={[memberRowStyles.statVal, { color: colors.textSecondary }]}>{member.streak}d</Text>
          </View>
          <View style={memberRowStyles.stat}>
            <Target size={11} color={colors.green} />
            <Text style={[memberRowStyles.statVal, { color: colors.textSecondary }]}>${member.amountSaved}</Text>
          </View>
        </View>
      </View>
      <View style={memberRowStyles.right}>
        <Text style={[memberRowStyles.daysLabel, { color: colors.textMuted }]}>Days left</Text>
        <Text style={[memberRowStyles.daysVal, { color: colors.text }]}>{member.daysRemaining}</Text>
      </View>
    </View>
  );
}

const memberRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12, gap: 10,
  },
  rank: { fontSize: 14, fontWeight: '800' as const, width: 30 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 14, fontWeight: '700' as const },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  name: { fontSize: 14, fontWeight: '600' as const },
  verifRow: { flexDirection: 'row', gap: 2 },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statVal: { fontSize: 11, fontWeight: '500' as const },
  right: { alignItems: 'center' },
  daysLabel: { fontSize: 9, fontWeight: '600' as const },
  daysVal: { fontSize: 16, fontWeight: '800' as const },
});

export default function ChallengeDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { challenges, joined } = useChallenges();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const challenge = useMemo(() => challenges.find(c => c.id === id), [challenges, id]);
  const userChallenge = useMemo(() => joined.find(j => j.challengeId === id), [joined, id]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleBoost = useCallback((memberName: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `Boost ${memberName}`,
      'Send a small contribution to encourage their progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '+$1', onPress: () => Alert.alert('Boost Sent!', `You sent $1 to ${memberName}.`) },
        { text: '+$5', onPress: () => Alert.alert('Boost Sent!', `You sent $5 to ${memberName}.`) },
        { text: '+$10', onPress: () => Alert.alert('Boost Sent!', `You sent $10 to ${memberName}.`) },
      ]
    );
  }, []);

  if (!challenge) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge</Text>
          <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
        </View>
        <Text style={[styles.notFound, { color: colors.textMuted }]}>Challenge not found.</Text>
      </View>
    );
  }

  const sortedMembers = [...MOCK_CHALLENGE_MEMBERS].sort((a, b) => a.rank - b.rank);
  const totalPot = sortedMembers.reduce((sum, m) => sum + m.amountSaved, 0);
  const rules = [
    'Contribute daily or weekly toward the goal',
    'Track your streak — consistency matters',
    'Top 3 on the leaderboard earn recognition',
    'No refunds or withdrawals during the challenge',
    'Be supportive — this is about accountability',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={styles.heroEmoji}>{challenge.emoji}</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{challenge.title}</Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>{challenge.description}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Users size={18} color={colors.green} />
              <Text style={[styles.statVal, { color: colors.text }]}>{sortedMembers.length}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>Members</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Trophy size={18} color={colors.warning} />
              <Text style={[styles.statVal, { color: colors.text }]}>${totalPot.toLocaleString()}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>Pot Size</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Clock size={18} color={colors.blue} />
              <Text style={[styles.statVal, { color: colors.text }]}>{challenge.durationDays}d</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>Duration</Text>
            </View>
          </View>

          {userChallenge && (
            <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.progressLabel, { color: colors.textMuted }]}>YOUR PROGRESS</Text>
              <View style={styles.progressBarRow}>
                <View style={[styles.progressBar, { backgroundColor: colors.surfaceLight }]}>
                  <View style={[styles.progressFill, {
                    backgroundColor: colors.green,
                    width: `${(userChallenge.progress * 100)}%` as never,
                  }]} />
                </View>
                <Text style={[styles.progressPct, { color: colors.green }]}>{Math.round(userChallenge.progress * 100)}%</Text>
              </View>
              <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                {userChallenge.daysCompleted}/{challenge.durationDays} days completed
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>LEADERBOARD</Text>
          <View style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {sortedMembers.map((member) => (
              <View key={member.id}>
                <TouchableOpacity
                  style={styles.memberTouchable}
                  onPress={() => member.name !== 'You' && handleBoost(member.name)}
                  activeOpacity={member.name !== 'You' ? 0.7 : 1}
                >
                  <MemberRow member={member} colors={colors} isCurrentUser={member.name === 'You'} />
                </TouchableOpacity>
                {member.name !== 'You' && (
                  <View style={styles.boostHint}>
                    <Star size={10} color={colors.textMuted} />
                    <Text style={[styles.boostHintText, { color: colors.textMuted }]}>Tap to boost</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RULES</Text>
          <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {rules.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <View style={[styles.ruleDot, { backgroundColor: colors.green }]} />
                <Text style={[styles.ruleText, { color: colors.textSecondary }]}>{rule}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' as const },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  notFound: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  heroCard: {
    borderRadius: 18, padding: 24, borderWidth: 1,
    alignItems: 'center', marginBottom: 14, gap: 8,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 20, fontWeight: '800' as const },
  heroDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  statsGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14,
    borderWidth: 1, alignItems: 'center', gap: 4,
  },
  statVal: { fontSize: 16, fontWeight: '800' as const },
  statLbl: { fontSize: 10, fontWeight: '600' as const },
  progressCard: {
    borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 18,
  },
  progressLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1, marginBottom: 8 },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' as never, borderRadius: 3 },
  progressPct: { fontSize: 13, fontWeight: '800' as const },
  progressSub: { fontSize: 12 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700' as const,
    letterSpacing: 1.5, marginBottom: 10, marginTop: 4,
  },
  leaderboardCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 18,
  },
  memberTouchable: { overflow: 'hidden' },
  boostHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingLeft: 54, paddingBottom: 6,
  },
  boostHintText: { fontSize: 10, fontWeight: '500' as const },
  rulesCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  ruleDot: {
    width: 6, height: 6, borderRadius: 3, marginTop: 5,
  },
  ruleText: { fontSize: 13, lineHeight: 19, flex: 1 },
});
