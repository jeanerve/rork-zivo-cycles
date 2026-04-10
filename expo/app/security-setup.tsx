import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Fingerprint, Lock, Trash2, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useSecurity } from '@/providers/SecurityProvider';

export default function SecuritySetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, enablePin, disablePin, toggleBiometric } = useSecurity();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handlePinDigit = useCallback((digit: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pinStep === 'enter') {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        setPinStep('confirm');
      }
    } else {
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === 4) {
        if (pin === next) {
          enablePin(next);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('PIN Set', 'Your PIN has been set successfully.');
          setShowPinSetup(false);
          setPin('');
          setConfirmPin('');
          setPinStep('enter');
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('PINs Don\'t Match', 'Please try again.');
          setPin('');
          setConfirmPin('');
          setPinStep('enter');
        }
      }
    }
  }, [pin, confirmPin, pinStep, enablePin]);

  const handlePinDelete = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pinStep === 'enter') {
      setPin(p => p.slice(0, -1));
    } else {
      setConfirmPin(p => p.slice(0, -1));
    }
  }, [pinStep]);

  const handleToggleBiometric = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Biometric authentication is only available on mobile devices.');
      return;
    }
    const result = await toggleBiometric();
    if (result) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [toggleBiometric]);

  const handleDisablePin = useCallback(() => {
    Alert.alert('Remove PIN', 'Are you sure you want to remove your PIN?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          disablePin();
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [disablePin]);

  const currentPin = pinStep === 'enter' ? pin : confirmPin;

  if (showPinSetup) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowPinSetup(false);
              setPin('');
              setConfirmPin('');
              setPinStep('enter');
            }}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Set PIN</Text>
          <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
        </View>

        <View style={styles.pinContent}>
          <View style={[styles.pinIconCircle, { backgroundColor: colors.greenMuted }]}>
            <Lock size={28} color={colors.green} />
          </View>
          <Text style={[styles.pinTitle, { color: colors.text }]}>
            {pinStep === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </Text>
          <Text style={[styles.pinSubtitle, { color: colors.textSecondary }]}>
            {pinStep === 'enter' ? 'Enter a 4-digit PIN' : 'Re-enter your PIN to confirm'}
          </Text>

          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: i < currentPin.length ? colors.green : colors.surfaceLight,
                    borderColor: i < currentPin.length ? colors.green : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
              if (key === '') return <View key="empty" style={styles.keypadBtn} />;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.keypadBtn, { backgroundColor: key === 'del' ? 'transparent' : colors.card }]}
                  onPress={() => key === 'del' ? handlePinDelete() : handlePinDigit(key)}
                  activeOpacity={0.6}
                >
                  {key === 'del' ? (
                    <Text style={[styles.keypadText, { color: colors.textSecondary, fontSize: 14 }]}>Delete</Text>
                  ) : (
                    <Text style={[styles.keypadText, { color: colors.text }]}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={styles.securityRow}
            onPress={() => {
              if (settings.pinEnabled) {
                handleDisablePin();
              } else {
                setShowPinSetup(true);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.securityIcon, { backgroundColor: colors.greenMuted }]}>
              <Lock size={18} color={colors.green} />
            </View>
            <View style={styles.securityInfo}>
              <Text style={[styles.securityLabel, { color: colors.text }]}>PIN Code</Text>
              <Text style={[styles.securityDesc, { color: colors.textMuted }]}>
                {settings.pinEnabled ? '4-digit PIN is active' : 'Set up a 4-digit PIN'}
              </Text>
            </View>
            {settings.pinEnabled ? (
              <View style={styles.activeRow}>
                <View style={[styles.activeBadge, { backgroundColor: colors.greenMuted }]}>
                  <Check size={12} color={colors.green} />
                  <Text style={[styles.activeText, { color: colors.green }]}>Active</Text>
                </View>
                <TouchableOpacity onPress={handleDisablePin} style={styles.removeIcon}>
                  <Trash2 size={14} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.setupText, { color: colors.green }]}>Set Up</Text>
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.securityRow} onPress={handleToggleBiometric} activeOpacity={0.7}>
            <View style={[styles.securityIcon, { backgroundColor: colors.blueMuted }]}>
              <Fingerprint size={18} color={colors.blue} />
            </View>
            <View style={styles.securityInfo}>
              <Text style={[styles.securityLabel, { color: colors.text }]}>Biometric Login</Text>
              <Text style={[styles.securityDesc, { color: colors.textMuted }]}>
                {Platform.OS === 'web' ? 'Available on mobile only' : 'Face ID / Fingerprint'}
              </Text>
            </View>
            {settings.biometricEnabled ? (
              <View style={[styles.activeBadge, { backgroundColor: colors.greenMuted }]}>
                <Check size={12} color={colors.green} />
                <Text style={[styles.activeText, { color: colors.green }]}>Active</Text>
              </View>
            ) : (
              <Text style={[styles.setupText, { color: colors.blue }]}>Enable</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About Security</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your PIN and biometric data are stored securely on your device. Enabling these features adds an extra layer of protection to your account.
          </Text>
        </View>
      </Animated.View>
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
  content: {
    paddingHorizontal: 20,
  },
  securityCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityInfo: {
    flex: 1,
  },
  securityLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  securityDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  removeIcon: {
    padding: 4,
  },
  setupText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
  infoCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  pinContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  pinIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pinTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  pinSubtitle: {
    fontSize: 14,
    marginBottom: 32,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 260,
    gap: 12,
  },
  keypadBtn: {
    width: 72,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadText: {
    fontSize: 22,
    fontWeight: '600' as const,
  },
});
