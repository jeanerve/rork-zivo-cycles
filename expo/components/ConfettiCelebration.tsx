import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ['#00E676', '#00C853', '#FFD700', '#FF6B6B', '#4FC3F7', '#AB47BC', '#FF8A65'];

interface ConfettiPiece {
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

interface ConfettiCelebrationProps {
  visible: boolean;
  onDismiss: () => void;
  onShareAchievement?: () => void;
  cycleName?: string;
  goalAmount?: number;
}

export default function ConfettiCelebration({ visible, onDismiss, onShareAchievement, cycleName, goalAmount }: ConfettiCelebrationProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiAnims = useRef<Animated.Value[]>(
    Array.from({ length: CONFETTI_COUNT }, () => new Animated.Value(0))
  ).current;

  const pieces = useMemo<ConfettiPiece[]>(() =>
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 800,
      duration: 2000 + Math.random() * 1500,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    })),
  []);

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      confettiAnims.forEach(a => a.setValue(0));
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    confettiAnims.forEach((anim, i) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: pieces[i].duration,
        delay: pieces[i].delay,
        useNativeDriver: true,
      }).start();
    });
  }, [visible, fadeAnim, scaleAnim, confettiAnims, pieces]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {confettiAnims.map((anim, i) => {
        const piece = pieces[i];
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, SCREEN_HEIGHT + 50],
        });
        const translateX = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60],
        });
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${piece.rotation + 720}deg`],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={`confetti-${i}`}
            style={[
              styles.confettiPiece,
              {
                left: piece.x,
                width: piece.size,
                height: piece.size * 1.5,
                backgroundColor: piece.color,
                borderRadius: piece.size * 0.2,
                transform: [{ translateY }, { translateX }, { rotate }],
                opacity,
              },
            ]}
          />
        );
      })}

      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.green + '33' }]}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={[styles.title, { color: colors.text }]}>Congratulations!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {cycleName ? `"${cycleName}" has been completed!` : 'Your cycle is complete!'}
            </Text>
            {goalAmount ? (
              <View style={[styles.amountBadge, { backgroundColor: colors.greenMuted }]}>
                <Text style={[styles.amountText, { color: colors.green }]}>
                  ${goalAmount.toLocaleString()} Goal Reached
                </Text>
              </View>
            ) : null}

            {onShareAchievement ? (
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: colors.green }]}
                onPress={() => {
                  onDismiss();
                  setTimeout(() => onShareAchievement(), 400);
                }}
                activeOpacity={0.85}
                testID="share-achievement-trigger"
              >
                <Sparkles size={16} color="#000" />
                <Text style={styles.shareBtnText}>Share What You Achieved</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} style={styles.dismissBtn}>
              <Text style={[styles.dismissText, { color: colors.textMuted }]}>
                {onShareAchievement ? 'Maybe later' : 'Tap to dismiss'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  card: {
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    width: '90%',
    maxWidth: 340,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  amountBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 20,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginBottom: 12,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000',
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 13,
  },
});
