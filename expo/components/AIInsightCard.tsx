import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useCycles } from '@/providers/CyclesProvider';
import { getFeaturedInsight } from '@/utils/aiInsights';

export default function AIInsightCard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { cycles, totalSaved, completedCycles, activeCycles } = useCycles();
  const router = useRouter();

  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const insight = useMemo(() => {
    if (!user) return null;
    return getFeaturedInsight({
      userName: user.name,
      streak: user.streak ?? 0,
      totalSaved,
      disciplineScore: user.disciplineScore ?? 0,
      activeCycles: activeCycles.length,
      completedCycles: completedCycles.length,
      cycles,
      userId: user.id,
    });
  }, [user, cycles, totalSaved, activeCycles.length, completedCycles.length]);

  if (!insight) return null;

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/ai-assistant');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      testID="ai-insight-card"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          { backgroundColor: colors.green, opacity: glowOpacity },
        ]}
      />
      <View style={[styles.iconWrap, { backgroundColor: colors.greenMuted, borderColor: colors.green + '30' }]}>
        <Sparkles size={18} color={colors.green} />
      </View>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.green }]}>Zivo AI</Text>
          {insight.emoji ? <Text style={styles.emoji}>{insight.emoji}</Text> : null}
        </View>
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>
          {insight.text}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -40,
    left: -30,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emoji: {
    fontSize: 13,
  },
  text: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
});
