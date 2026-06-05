import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Switch, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldBan, Lock, Unlock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useCard, SPENDING_CATEGORIES } from '@/providers/CardProvider';

export default function SpendingCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { categories, updateCategory, toggleCategoryLock } = useCard();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleBudgetUpdate = useCallback((categoryId: string, budget: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateCategory(categoryId, { monthlyBudget: budget });
  }, [updateCategory]);

  const handleAutoLockToggle = useCallback((categoryId: string, value: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateCategory(categoryId, { autoLock: value });
  }, [updateCategory]);

  const handleLockToggle = useCallback((categoryId: string) => {
    toggleCategoryLock(categoryId);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [toggleCategoryLock]);

  const [editingBudget, setEditingBudget] = useState<{ id: string; value: string } | null>(null);

  const handleBudgetPress = useCallback((categoryId: string, currentBudget: number) => {
    setEditingBudget({ id: categoryId, value: currentBudget > 0 ? String(currentBudget) : '' });
  }, []);

  const handleBudgetSave = useCallback((categoryId: string) => {
    if (!editingBudget || editingBudget.id !== categoryId) return;
    const val = parseFloat(editingBudget.value) || 0;
    handleBudgetUpdate(categoryId, val);
    setEditingBudget(null);
  }, [editingBudget, handleBudgetUpdate]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Spending Categories</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.orangeMuted }]}>
              <ShieldBan size={24} color={colors.orange} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Category Locks</Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Set monthly budgets per category. When you hit your limit, the category auto-locks to prevent overspending.
            </Text>
          </View>

          {categories.map((cat) => {
            const catMeta = SPENDING_CATEGORIES.find(c => c.type === cat.type);
            const progress = cat.monthlyBudget > 0 ? Math.min(cat.currentSpend / cat.monthlyBudget, 1) : 0;
            return (
              <View key={cat.id} style={[styles.catCard, {
                backgroundColor: colors.card,
                borderColor: cat.isLocked ? colors.danger + '44' : colors.cardBorder,
              }]}>
                <View style={styles.catHeader}>
                  <View style={styles.catLeft}>
                    <Text style={styles.catEmoji}>{catMeta?.emoji ?? '📦'}</Text>
                    <View>
                      <Text style={[styles.catName, { color: colors.text }]}>{cat.label}</Text>
                      {cat.isLocked && (
                        <View style={[styles.lockedBadge, { backgroundColor: colors.dangerMuted }]}>
                          <Lock size={10} color={colors.danger} />
                          <Text style={[styles.lockedText, { color: colors.danger }]}>LOCKED</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleLockToggle(cat.id)}
                    style={[styles.lockBtn, {
                      backgroundColor: cat.isLocked ? colors.dangerMuted : colors.surfaceLight,
                    }]}
                  >
                    {cat.isLocked ? (
                      <Unlock size={15} color={colors.danger} />
                    ) : (
                      <Lock size={15} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.budgetRow}>
                  <TouchableOpacity
                    style={[styles.budgetInput, { backgroundColor: colors.surfaceLight }]}
                    onPress={() => handleBudgetPress(cat.id, cat.monthlyBudget)}
                  >
                    {editingBudget?.id === cat.id ? (
                      <TextInput
                        style={[styles.budgetInputField, { color: colors.text }]}
                        value={editingBudget.value}
                        onChangeText={(v) => setEditingBudget({ id: cat.id, value: v })}
                        onBlur={() => handleBudgetSave(cat.id)}
                        keyboardType="numeric"
                        placeholder="Budget"
                        placeholderTextColor={colors.textMuted}
                        autoFocus
                      />
                    ) : (
                      <Text style={[styles.budgetText, { color: cat.monthlyBudget > 0 ? colors.text : colors.textMuted }]}>
                        ${cat.monthlyBudget > 0 ? cat.monthlyBudget.toLocaleString() : 'Set budget'}
                      </Text>
                    )}
                    <Text style={[styles.budgetLabel, { color: colors.textMuted }]}>/month</Text>
                  </TouchableOpacity>
                  <Text style={[styles.spendText, { color: colors.textSecondary }]}>
                    Spent: ${cat.currentSpend.toLocaleString()}
                  </Text>
                </View>

                {cat.monthlyBudget > 0 && (
                  <View style={styles.progressSection}>
                    <View style={[styles.progressBar, { backgroundColor: colors.surfaceLight }]}>
                      <View style={[styles.progressFill, {
                        backgroundColor: progress >= 1 ? colors.danger : progress >= 0.8 ? colors.warning : colors.green,
                        width: `${progress * 100}%` as never,
                      }]} />
                    </View>
                    <Text style={[styles.progressPercent, {
                      color: progress >= 1 ? colors.danger : progress >= 0.8 ? colors.warning : colors.textMuted,
                    }]}>{Math.round(progress * 100)}%</Text>
                  </View>
                )}

                <View style={styles.autoLockRow}>
                  <Text style={[styles.autoLockLabel, { color: colors.textMuted }]}>Auto-lock when budget reached</Text>
                  <Switch
                    value={cat.autoLock}
                    onValueChange={(v) => handleAutoLockToggle(cat.id, v)}
                    trackColor={{ false: colors.surfaceLight, true: colors.orange + '44' }}
                    thumbColor={cat.autoLock ? colors.orange : colors.textMuted}
                  />
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: colors.dangerMuted, borderColor: colors.danger + '22' }]}
            onPress={() => Alert.alert('Reset All', 'Reset all category budgets and spending to zero?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => {
                categories.forEach(c => updateCategory(c.id, { monthlyBudget: 0, currentSpend: 0, isLocked: false }));
              }},
            ])}
          >
            <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Reset All Categories</Text>
          </TouchableOpacity>
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
    borderRadius: 18, padding: 20, borderWidth: 1,
    alignItems: 'center', marginBottom: 16, gap: 10,
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800' as const },
  heroDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  catCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10,
  },
  catHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catEmoji: { fontSize: 22 },
  catName: { fontSize: 15, fontWeight: '700' as const },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4,
  },
  lockedText: { fontSize: 9, fontWeight: '700' as const },
  lockBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  budgetRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  budgetInput: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4,
  },
  budgetInputField: {
    fontSize: 16, fontWeight: '700' as const,
    minWidth: 60, padding: 0,
  },
  budgetText: { fontSize: 16, fontWeight: '700' as const },
  budgetLabel: { fontSize: 12 },
  spendText: { fontSize: 13, fontWeight: '500' as const },
  progressSection: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  progressBar: {
    flex: 1, height: 5, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%' as never, borderRadius: 3,
  },
  progressPercent: { fontSize: 11, fontWeight: '600' as const, width: 36, textAlign: 'right' },
  autoLockRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  autoLockLabel: { fontSize: 12, fontWeight: '500' as const },
  dangerBtn: {
    alignItems: 'center', paddingVertical: 14,
    marginTop: 16, borderRadius: 12, borderWidth: 1,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '600' as const },
});
