import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CycleTypeColors } from '@/constants/colors';
import { useTheme } from '@/providers/ThemeProvider';
import { useCycles } from '@/providers/CyclesProvider';
import CycleCard from '@/components/CycleCard';
import { CycleType } from '@/types';

const FILTER_OPTIONS: { label: string; value: CycleType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Individual', value: 'individual' },
  { label: 'Family', value: 'family' },
  { label: 'Community', value: 'community' },
  { label: 'Teen', value: 'teen' },
];

export default function CyclesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cycles } = useCycles();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<CycleType | 'all'>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const filteredCycles = useMemo(() => {
    if (activeFilter === 'all') return cycles;
    return cycles.filter((c) => c.type === activeFilter);
  }, [cycles, activeFilter]);

  const handleFilterPress = useCallback((value: CycleType | 'all') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(value);
  }, []);

  const handleCreate = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-cycle');
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Your Cycles</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{cycles.length} active cycle{cycles.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.green }]} onPress={handleCreate} testID="create-cycle-btn">
            <Plus size={20} color={colors.background} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.value;
            const chipColor = option.value === 'all' ? colors.green : (CycleTypeColors[option.value] ?? colors.green);
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.filterChip, { backgroundColor: colors.card, borderColor: isActive ? chipColor : colors.cardBorder }, isActive && { backgroundColor: chipColor + '22' }]}
                onPress={() => handleFilterPress(option.value)}
              >
                <Text style={[styles.filterText, { color: isActive ? chipColor : colors.textSecondary }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {filteredCycles.map((cycle) => (
            <CycleCard key={cycle.id} cycle={cycle} />
          ))}
          {filteredCycles.length === 0 && (
            <View style={styles.emptyState}>
              <Filter size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No {activeFilter !== 'all' ? activeFilter : ''} cycles found</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800' as const },
  subtitle: { fontSize: 13, marginTop: 2 },
  createBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { maxHeight: 44, marginBottom: 16 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' as const },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
