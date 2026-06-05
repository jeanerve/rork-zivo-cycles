import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Target, Zap, TrendingUp, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useCard } from '@/providers/CardProvider';
import { useCycles } from '@/providers/CyclesProvider';

export default function RoundUpsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { roundUp, updateRoundUp } = useCard();
  const { activeCycles } = useCycles();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleToggle = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateRoundUp({ enabled: !roundUp.enabled });
  }, [roundUp.enabled, updateRoundUp]);

  const handleDestination = useCallback((dest: 'active_cycle' | 'milestone_goal' | 'savings', cycleId?: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateRoundUp({ destination: dest, cycleId });
  }, [updateRoundUp]);

  const destinations: { id: 'active_cycle' | 'milestone_goal' | 'savings'; label: string; desc: string }[] = [
    { id: 'active_cycle', label: 'Active Cycle', desc: 'Round ups go to your current savings cycle' },
    { id: 'milestone_goal', label: 'Milestone Goal', desc: 'Apply round ups toward a specific goal' },
    { id: 'savings', label: 'General Savings', desc: 'Accumulate round ups in your savings wallet' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Round Ups</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.tealMuted }]}>
              <Target size={28} color={colors.teal} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Spare Change, Big Impact</Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Every purchase gets rounded up. The spare change goes directly toward your savings goals.
            </Text>
            <View style={styles.exampleRow}>
              <View style={[styles.exampleChip, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.exampleText, { color: colors.textSecondary }]}>$4.50 coffee → $5.00</Text>
                <ArrowRight size={12} color={colors.green} />
                <Text style={[styles.exampleGreen, { color: colors.green }]}>+$0.50</Text>
              </View>
            </View>
          </View>

          <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Enable Round Ups</Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                  {roundUp.enabled ? 'Automatically saving spare change' : 'Round ups are currently off'}
                </Text>
              </View>
              <Switch
                value={roundUp.enabled}
                onValueChange={handleToggle}
                trackColor={{ false: colors.surfaceLight, true: colors.teal + '44' }}
                thumbColor={roundUp.enabled ? colors.teal : colors.textMuted}
              />
            </View>
          </View>

          {roundUp.enabled && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SAVE TO</Text>
              {destinations.map((dest) => (
                <TouchableOpacity
                  key={dest.id}
                  style={[styles.destCard, {
                    backgroundColor: colors.card,
                    borderColor: roundUp.destination === dest.id ? colors.teal : colors.cardBorder,
                    borderWidth: roundUp.destination === dest.id ? 1.5 : 1,
                  }]}
                  onPress={() => handleDestination(dest.id, dest.id === 'active_cycle' ? activeCycles[0]?.id : undefined)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.destIconWrap, {
                    backgroundColor: roundUp.destination === dest.id ? colors.tealMuted : colors.surfaceLight,
                  }]}>
                    {dest.id === 'active_cycle' ? (
                      <Zap size={18} color={roundUp.destination === dest.id ? colors.teal : colors.textMuted} />
                    ) : (
                      <TrendingUp size={18} color={roundUp.destination === dest.id ? colors.teal : colors.textMuted} />
                    )}
                  </View>
                  <View style={styles.destInfo}>
                    <Text style={[styles.destLabel, {
                      color: roundUp.destination === dest.id ? colors.teal : colors.text,
                    }]}>{dest.label}</Text>
                    <Text style={[styles.destDesc, { color: colors.textMuted }]}>{dest.desc}</Text>
                  </View>
                  {roundUp.destination === dest.id && (
                    <View style={[styles.destCheck, { backgroundColor: colors.teal }]}>
                      <Text style={styles.destCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL ROUNDED UP</Text>
                <Text style={[styles.totalAmount, { color: colors.teal }]}>${roundUp.totalRounded.toFixed(2)}</Text>
              </View>
            </>
          )}
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
  heroCard: {
    borderRadius: 18, padding: 24, borderWidth: 1,
    alignItems: 'center', marginBottom: 16, gap: 12,
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '800' as const },
  heroDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  exampleRow: { marginTop: 4 },
  exampleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  exampleText: { fontSize: 13, fontWeight: '500' as const },
  exampleGreen: { fontSize: 13, fontWeight: '700' as const },
  toggleCard: {
    borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  toggleLabel: { fontSize: 15, fontWeight: '700' as const, marginBottom: 2 },
  toggleDesc: { fontSize: 12, maxWidth: '80%' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700' as const,
    letterSpacing: 1.5, marginBottom: 10,
  },
  destCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 16, marginBottom: 8, gap: 14,
  },
  destIconWrap: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  destInfo: { flex: 1 },
  destLabel: { fontSize: 14, fontWeight: '700' as const, marginBottom: 2 },
  destDesc: { fontSize: 12 },
  destCheck: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  destCheckText: { color: '#000', fontSize: 12, fontWeight: '800' as const },
  totalCard: {
    borderRadius: 14, padding: 18, borderWidth: 1,
    alignItems: 'center', marginTop: 8,
  },
  totalLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1, marginBottom: 6 },
  totalAmount: { fontSize: 32, fontWeight: '800' as const },
});
