import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Wifi } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useCard, CARD_THEMES } from '@/providers/CardProvider';
import { useAuth } from '@/providers/AuthProvider';

const PATTERNS: { id: 'none' | 'dots' | 'lines' | 'gradient' | 'mesh'; label: string }[] = [
  { id: 'none', label: 'Clean' },
  { id: 'dots', label: 'Dots' },
  { id: 'lines', label: 'Lines' },
  { id: 'gradient', label: 'Glow' },
  { id: 'mesh', label: 'Mesh' },
];

function CardPreview({ theme, pattern, userName }: { theme: typeof CARD_THEMES[0]; pattern: string; userName: string }) {
  const accentColor = theme.accent.replace(/[\d.]+\)$/, '1)');

  return (
    <View style={[previewStyles.card, { backgroundColor: theme.primary }]}>
      <View style={[previewStyles.cardBorder, { borderColor: theme.accent }]} />

      {pattern === 'dots' && (
        <View style={previewStyles.patternContainer}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                previewStyles.dot,
                {
                  left: (i % 5) * 70 + 20,
                  top: Math.floor(i / 5) * 50 + 15,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          ))}
        </View>
      )}

      {pattern === 'lines' && (
        <View style={previewStyles.patternContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={[
                previewStyles.line,
                {
                  top: i * 35 + 10,
                  backgroundColor: theme.accent,
                  transform: [{ rotate: '-25deg' }],
                },
              ]}
            />
          ))}
        </View>
      )}

      {pattern === 'gradient' && (
        <>
          <View style={[previewStyles.glowCircle, { backgroundColor: theme.accent, top: -30, right: -30 }]} />
          <View style={[previewStyles.glowCircle, { backgroundColor: theme.accent, bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50 }]} />
        </>
      )}

      {pattern === 'mesh' && (
        <View style={previewStyles.patternContainer}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[
                previewStyles.meshLine,
                {
                  top: i * 18,
                  backgroundColor: theme.accent,
                  transform: [{ rotate: i % 2 === 0 ? '30deg' : '-30deg' }],
                },
              ]}
            />
          ))}
        </View>
      )}

      <View style={previewStyles.cardChip} />
      <View style={previewStyles.cardContactless}>
        <Wifi size={14} color="rgba(255,255,255,0.4)" />
      </View>

      <View style={previewStyles.header}>
        <Text style={[previewStyles.logo, { color: accentColor }]}>ZIVO</Text>
        <Text style={previewStyles.typeLabel}>DEBIT</Text>
      </View>

      <View style={previewStyles.numberRow}>
        <Text style={previewStyles.dots}>****  ****  ****  </Text>
        <Text style={previewStyles.last4}>4289</Text>
      </View>

      <View style={previewStyles.footer}>
        <View>
          <Text style={previewStyles.label}>CARD HOLDER</Text>
          <Text style={previewStyles.value}>{userName.toUpperCase()}</Text>
        </View>
        <View style={previewStyles.footerRight}>
          <View>
            <Text style={previewStyles.label}>VALID THRU</Text>
            <Text style={previewStyles.value}>12/28</Text>
          </View>
          <View style={previewStyles.network}>
            <View style={previewStyles.circle1} />
            <View style={previewStyles.circle2} />
          </View>
        </View>
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1.6,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    zIndex: 1,
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  line: {
    position: 'absolute',
    left: -50,
    right: -50,
    height: 1,
  },
  meshLine: {
    position: 'absolute',
    left: -100,
    right: -100,
    height: 0.5,
  },
  glowCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cardChip: {
    position: 'absolute',
    top: 52,
    left: 22,
    width: 32,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    zIndex: 2,
  },
  cardContactless: {
    position: 'absolute',
    top: 54,
    left: 60,
    transform: [{ rotate: '90deg' }],
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
    zIndex: 2,
  },
  logo: {
    fontSize: 18,
    fontWeight: '900' as const,
    letterSpacing: 3,
  },
  typeLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 2,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 2,
  },
  dots: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 3,
  },
  last4: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  label: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 7,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 2,
  },
  value: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  network: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  circle1: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(235, 80, 60, 0.7)',
  },
  circle2: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 170, 0, 0.7)',
    marginLeft: -7,
  },
});

export default function CardCustomizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, currentTheme, updateCardTheme, updateCardPattern } = useCard();
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleThemeSelect = useCallback((themeId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateCardTheme(themeId);
  }, [updateCardTheme]);

  const handlePatternSelect = useCallback((pattern: 'none' | 'dots' | 'lines' | 'gradient' | 'mesh') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateCardPattern(pattern);
  }, [updateCardPattern]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Customize Card</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.previewSection}>
            <CardPreview
              theme={currentTheme}
              pattern={settings.pattern}
              userName={user?.name ?? 'USER'}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Card Color</Text>
          <View style={styles.themeGrid}>
            {CARD_THEMES.map((theme) => {
              const isSelected = settings.colorTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.card, borderColor: isSelected ? colors.green : colors.cardBorder },
                  ]}
                  onPress={() => handleThemeSelect(theme.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.themePreview, { backgroundColor: theme.primary }]}>
                    <View style={[styles.themeAccent, { backgroundColor: theme.accent }]} />
                  </View>
                  <Text style={[styles.themeLabel, { color: isSelected ? colors.green : colors.textSecondary }]}>{theme.label}</Text>
                  {isSelected && (
                    <View style={[styles.checkIcon, { backgroundColor: colors.green }]}>
                      <Check size={10} color={colors.background} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Pattern</Text>
          <View style={styles.patternRow}>
            {PATTERNS.map((p) => {
              const isSelected = settings.pattern === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.patternOption,
                    { backgroundColor: colors.card, borderColor: isSelected ? colors.green : colors.cardBorder },
                  ]}
                  onPress={() => handlePatternSelect(p.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.patternLabel, { color: isSelected ? colors.green : colors.textSecondary }]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  previewSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  themeOption: {
    width: '30%',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  themePreview: {
    width: 44,
    height: 30,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  themeAccent: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  checkIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  patternOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  patternLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
