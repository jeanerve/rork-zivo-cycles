import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  Easing,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');
const GREEN = '#00E676';

interface SplashIntroProps {
  onFinish: () => void;
}

export default function SplashIntro({ onFinish }: SplashIntroProps) {
  const [linePhase, setLinePhase] = useState<'growing' | 'visible' | 'hidden'>('growing');
  const thinLineWidth = useRef(new Animated.Value(0)).current;

  const circleOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0.5)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const cyclesOpacity = useRef(new Animated.Value(0)).current;
  const cyclesSlide = useRef(new Animated.Value(15)).current;

  const screenFade = useRef(new Animated.Value(1)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const handleSkip = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(screenFade, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onFinishRef.current();
    });
  }, [screenFade]);

  useEffect(() => {
    console.log('[SplashIntro] Starting animation');

    Animated.timing(skipOpacity, {
      toValue: 1,
      duration: 600,
      delay: 800,
      useNativeDriver: true,
    }).start();

    setLinePhase('growing');
    Animated.timing(thinLineWidth, {
      toValue: 1,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const scene2Timer = setTimeout(() => {
      setLinePhase('hidden');

      Animated.parallel([
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(circleScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, 1200);

    const scene3Timer = setTimeout(() => {
      Animated.timing(circleOpacity, {
        toValue: 0.15,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2500);

    const scene4Timer = setTimeout(() => {
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(cyclesOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(cyclesSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      }, 250);

      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 3300);

    const exitTimer = setTimeout(() => {
      console.log('[SplashIntro] Exiting');
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onFinishRef.current();
      });
    }, 4500);

    return () => {
      clearTimeout(scene2Timer);
      clearTimeout(scene3Timer);
      clearTimeout(scene4Timer);
      clearTimeout(exitTimer);
    };
  }, [skipOpacity, thinLineWidth, circleOpacity, circleScale, logoScale, logoOpacity, brandOpacity, cyclesOpacity, cyclesSlide, screenFade]);

  const lineWidth = thinLineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SW * 0.55],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]} pointerEvents="auto">
      {linePhase !== 'hidden' && (
        <Animated.View
          style={[
            styles.thinLine,
            {
              width: lineWidth,
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.circleRing,
          {
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/zivo-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.brandWrap, { opacity: brandOpacity }]}>
        <Text style={styles.brandText}>Zivo</Text>
        <Animated.View style={{ opacity: cyclesOpacity, transform: [{ translateY: cyclesSlide }] }}>
          <Text style={styles.cyclesText}>C Y C L E S</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.skipWrap, { opacity: skipOpacity }]}>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipBtn}
          activeOpacity={0.6}
          testID="splash-skip-btn"
        >
          <Text style={styles.skipLabel}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  thinLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: GREEN,
    borderRadius: 1,
  },
  circleRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
  logoWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,

  },
  brandWrap: {
    position: 'absolute',
    bottom: SH * 0.28,
    alignItems: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
  },
  cyclesText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 6,
    marginTop: 6,
  },
  skipWrap: {
    position: 'absolute',
    bottom: 50,
    right: 28,
  },
  skipBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '500' as const,
  },
});
