import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useChallenges } from '@/providers/ChallengesProvider';
import { Challenge } from '@/types';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';

function ChallengeCard({ challenge, joined, progress, onJoin, onLeave, colors }: {
  challenge: Challenge;
  joined: boolean;
  progress: number;
  onJoin: () => void;
  onLeave: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, tension: 200, friction: 7 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.cardAccent, { backgroundColor: challenge.color }]} />
        <View style={styles.cardHeader}>
          <View style={[styles.emojiWrap, { backgroundColor: challenge.color + '18', borderColor: challenge.color + '30' }]}>
            <Text style={styles.emoji}>{challenge.emoji}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={styles.participantsRow}>
              <Users size={11} color={colors.textMuted} />
              <Text style={[styles.participantsText, { color: colors.textMuted }]}>
                {challenge.participants.toLocaleString()} joined
              </Text>
            </View>
            <Text style={[styles.durationText, { color: colors.textSecondary }]}>
              {challenge.durationDays} days
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{challenge.title}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{challenge.description}</Text>

        {challenge.targetAmount ? (
          <View style={[styles.targetPill, { backgroundColor: challenge.color + '15' }]}>
            <Sparkles size={11} color={challenge.color} />
            <Text style={[styles.targetText, { color: challenge.color }]}>
              Target: ${challenge.targetAmount.toLocaleString()}
            </Text>
          </View>
        ) : null}

        {joined && (
          <View style={styles.progressWrap}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Your progress</Text>
              <Text style={[styles.progressValue, { color: challenge.color }]}>{Math.round(progress * 100)}%</Text>
            </View>
            <AnimatedProgressBar progress={progress} color={challenge.color} height={4} />
          </View>
        )}

        {joined ? (
          <TouchableOpacity
            onPress={onLeave}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.joinedBtn, { borderColor: challenge.color }]}
            activeOpacity={0.85}
          >
            <Check size={15} color={challenge.color} />
            <Text style={[styles.joinedBtnText, { color: challenge.color }]}>Joined · Tap to leave</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onJoin}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.joinBtn, { backgroundColor: challenge.color }]}
            activeOpacity={0.85}
            testID={`join-${challenge.id}`}
          >
            <Text style={styles.joinBtnText}>Join Challenge</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { challenges, joined, joinChallenge, leaveChallenge } = useChallenges();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleJoin = useCallback((id: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    joinChallenge(id);
  }, [joinChallenge]);

  const handleLeave = useCallback((userChallengeId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    leaveChallenge(userChallengeId);
  }, [leaveChallenge]);

  const joinedMap = useMemo(() => {
    const map: Record<string, { id: string; progress: number }> = {};
    for (const j of joined) {
      if (j.status === 'active') {
        map[j.challengeId] = { id: j.id, progress: j.progress };
      }
    }
    return map;
  }, [joined]);

  const activeCount = Object.keys(joinedMap).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challenges</Text>
        <View style={{ width: 30 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={styles.intro}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              Save together.{'\n'}<Text style={{ color: colors.green }}>Stay disciplined.</Text>
            </Text>
            <Text style={[styles.introSub, { color: colors.textSecondary }]}>
              Join community challenges to build saving habits with thousands of others.
            </Text>
            {activeCount > 0 && (
              <View style={[styles.activeBanner, { backgroundColor: colors.greenMuted, borderColor: colors.green + '30' }]}>
                <Sparkles size={14} color={colors.green} />
                <Text style={[styles.activeBannerText, { color: colors.green }]}>
                  You're active in {activeCount} challenge{activeCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {challenges.map(challenge => {
            const j = joinedMap[challenge.id];
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                joined={!!j}
                progress={j?.progress ?? 0}
                onJoin={() => handleJoin(challenge.id)}
                onLeave={() => j && handleLeave(j.id)}
                colors={colors}
              />
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 20,
  },
  intro: {
    marginBottom: 20,
    marginTop: 6,
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 10,
  },
  introSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  activeBannerText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emoji: {
    fontSize: 22,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  participantsText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 12,
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  targetText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  progressWrap: {
    marginBottom: 14,
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '800' as const,
  },
  joinBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800' as const,
  },
  joinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinedBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
});
