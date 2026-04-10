import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(btnSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoScale, logoOpacity, contentFade, btnSlide]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
      <View style={styles.topSection}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <View style={styles.logoImageWrap}>
            <Image
              source={require('@/assets/images/zivo-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>Zivo</Text>
          <Text style={[styles.logoSubtext, { color: colors.green }]}>Cycles</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineContainer, { opacity: contentFade }]}>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Build financial discipline</Text>
          <Text style={[styles.taglineSub, { color: colors.textMuted }]}>through structured savings</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomSection, { opacity: contentFade, transform: [{ translateY: btnSlide }] }]}>
        <TouchableOpacity
          style={[styles.createAccountBtn, { backgroundColor: colors.green }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/signup');
          }}
          activeOpacity={0.8}
          testID="create-account-btn"
        >
          <Text style={[styles.createAccountText, { color: colors.background }]}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/login');
          }}
          activeOpacity={0.8}
          testID="login-btn"
        >
          <Text style={[styles.loginText, { color: colors.text }]}>Log In</Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
          By continuing, you agree to our Terms of Service
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoImageWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoImage: { width: 120, height: 120 },
  logoText: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1 },
  logoSubtext: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 4, textTransform: 'uppercase' as const, marginTop: 2 },
  taglineContainer: { alignItems: 'center' },
  tagline: { fontSize: 17, fontWeight: '500' as const, textAlign: 'center' },
  taglineSub: { fontSize: 15, fontWeight: '400' as const, marginTop: 4 },
  bottomSection: { paddingHorizontal: 24, paddingBottom: 20 },
  createAccountBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  createAccountText: { fontSize: 17, fontWeight: '700' as const },
  loginBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1 },
  loginText: { fontSize: 17, fontWeight: '600' as const },
  disclaimer: { fontSize: 12, textAlign: 'center', marginTop: 16 },
});
