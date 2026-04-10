import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { CycleTypeColors, CycleTypeBgColors } from '@/constants/colors';
import { useTheme } from '@/providers/ThemeProvider';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import { Cycle } from '@/types';

interface CycleCardProps {
  cycle: Cycle;
}

export default React.memo(function CycleCard({ cycle }: CycleCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progress = cycle.goalAmount > 0 ? cycle.currentAmount / cycle.goalAmount : 0;
  const typeColor = CycleTypeColors[cycle.type] ?? colors.green;
  const typeBg = CycleTypeBgColors[cycle.type] ?? colors.greenMuted;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/cycle/${cycle.id}`);
  }, [cycle.id, router]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handlePress}
      testID={`cycle-card-${cycle.id}`}
    >
      <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeTag, { backgroundColor: typeBg }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>
                {cycle.type.charAt(0).toUpperCase() + cycle.type.slice(1)}
              </Text>
            </View>
            <Text style={[styles.cycleName, { color: colors.text }]} numberOfLines={1}>{cycle.name}</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.currentAmount, { color: colors.text }]}>${cycle.currentAmount.toLocaleString()}</Text>
          <Text style={[styles.goalAmount, { color: colors.textMuted }]}>/ ${cycle.goalAmount.toLocaleString()}</Text>
        </View>

        <AnimatedProgressBar progress={progress} color={typeColor} height={5} />

        <View style={styles.footer}>
          <Text style={[styles.percentText, { color: colors.textSecondary }]}>{Math.round(progress * 100)}%</Text>
          {cycle.members.length > 1 && (
            <View style={styles.membersRow}>
              {cycle.members.slice(0, 3).map((m, i) => (
                <View key={m.id} style={[styles.memberAvatarWrapper, { borderColor: colors.card }, i > 0 && { marginLeft: -8 }]}>
                  <Image source={{ uri: m.avatar }} style={styles.memberAvatar} />
                </View>
              ))}
              {cycle.members.length > 3 && (
                <View style={[styles.memberAvatarWrapper, { marginLeft: -8, backgroundColor: colors.surfaceLight, borderColor: colors.card }]}>
                  <Text style={[styles.moreCount, { color: colors.textSecondary }]}>+{cycle.members.length - 3}</Text>
                </View>
              )}
            </View>
          )}
          <Text style={[styles.frequencyText, { color: colors.textMuted }]}>{cycle.frequency}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flex: 1, marginRight: 8 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  typeText: { fontSize: 11, fontWeight: '600' as const },
  cycleName: { fontSize: 17, fontWeight: '700' as const },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  currentAmount: { fontSize: 24, fontWeight: '800' as const },
  goalAmount: { fontSize: 14, marginLeft: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  percentText: { fontSize: 12, fontWeight: '600' as const },
  membersRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatarWrapper: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  memberAvatar: { width: 24, height: 24, borderRadius: 12 },
  moreCount: { fontSize: 9, fontWeight: '700' as const },
  frequencyText: { fontSize: 11, textTransform: 'capitalize' as const },
});
