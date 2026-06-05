import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, Unlock, RefreshCw, Wifi, Shield, Copy, CreditCard, Smartphone, Eye, EyeOff, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useCard, CARD_THEMES } from '@/providers/CardProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function CardExperienceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { settings, currentTheme, cardDetails, toggleCardLock, regenerateCard, toggleWallet } = useCard();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleToggleLock = useCallback(() => {
    const isNowLocked = toggleCardLock();
    void Haptics.notificationAsync(
      isNowLocked ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );
    Alert.alert(
      isNowLocked ? 'Card Locked' : 'Card Unlocked',
      isNowLocked
        ? 'All transactions are now blocked. Unlock anytime to resume spending.'
        : 'Your card is now active and ready to use.'
    );
  }, [toggleCardLock]);

  const handleRegenerate = useCallback(() => {
    Alert.alert(
      'Generate New Card',
      'This will instantly create a new card number and CVV. Your balance and account remain the same.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const newDetails = regenerateCard();
            Alert.alert('New Card Ready', `Your new card ends in ${newDetails.last4}. Update any saved payment methods.`);
          },
        },
      ]
    );
  }, [regenerateCard]);

  const handleToggleWallet = useCallback(() => {
    toggleWallet();
    void Haptics.notificationAsync(
      !cardDetails.addedToWallet ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
    Alert.alert(
      cardDetails.addedToWallet ? 'Removed from Wallet' : 'Added to Wallet',
      cardDetails.addedToWallet
        ? 'Card removed from Apple Pay / Google Pay.'
        : 'Card added to your device wallet for tap-to-pay.'
    );
  }, [toggleWallet, cardDetails.addedToWallet]);

  const accentColor = currentTheme.accent.replace(/[\d.]+\)$/, '1)');

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Zivo Card</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.cardWrapper, { backgroundColor: currentTheme.primary, borderColor: currentTheme.accent }]}>
            {settings.isLocked && (
              <View style={styles.cardLockedOverlay}>
                <Lock size={32} color="rgba(255,255,255,0.5)" />
                <Text style={styles.cardLockedText}>Card Locked</Text>
              </View>
            )}
            <View style={styles.cardChip} />
            <View style={styles.cardContactless}>
              <Wifi size={18} color="rgba(255,255,255,0.4)" />
            </View>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLogo, { color: accentColor }]}>ZIVO</Text>
              <Text style={styles.cardTypeBadge}>DEBIT</Text>
            </View>
            <View style={styles.cardNumberRow}>
              <TouchableOpacity onPress={() => { setShowCardNumber(v => !v); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Text style={styles.cardNumber}>
                  {showCardNumber ? cardDetails.cardNumber : '****  ****  ****  ' + cardDetails.last4}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardDetailsRow}>
              <View>
                <Text style={styles.cardLabel}>CARD HOLDER</Text>
                <Text style={styles.cardValue}>{cardDetails.cardholderName}</Text>
              </View>
              <View style={styles.cardDetailsRight}>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>{cardDetails.expiryMonth}/{cardDetails.expiryYear}</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowCVV(v => !v); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={styles.cardLabel}>CVV</Text>
                  <Text style={styles.cardValue}>{showCVV ? cardDetails.cvv : '***'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardNetworkRow}>
              <View style={styles.cardNetworkCircle1} />
              <View style={styles.cardNetworkCircle2} />
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleToggleLock}
              activeOpacity={0.7}
            >
              {settings.isLocked ? (
                <Unlock size={20} color={colors.green} />
              ) : (
                <Lock size={20} color={colors.warning} />
              )}
              <Text style={[styles.actionText, { color: settings.isLocked ? colors.green : colors.warning }]}>
                {settings.isLocked ? 'Unlock Card' : 'Lock Card'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleRegenerate}
              activeOpacity={0.7}
            >
              <RefreshCw size={20} color={colors.blue} />
              <Text style={[styles.actionText, { color: colors.blue }]}>New Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleToggleWallet}
              activeOpacity={0.7}
            >
              <Smartphone size={20} color={cardDetails.addedToWallet ? colors.green : colors.textMuted} />
              <Text style={[styles.actionText, { color: cardDetails.addedToWallet ? colors.green : colors.textMuted }]}>
                {cardDetails.addedToWallet ? 'In Wallet' : 'Add to Wallet'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.infoRow}>
              <Shield size={16} color={colors.green} />
              <Text style={[styles.infoText, { color: colors.text }]}>Protected by Zivo Security</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <CreditCard size={16} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {cardDetails.addedToWallet ? 'Apple Pay / Google Pay enabled' : 'Tap to add to Apple Pay or Google Pay'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.customizeBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/card-customize')}
            activeOpacity={0.7}
          >
            <Text style={[styles.customizeText, { color: colors.text }]}>Customize Card Design</Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: colors.dangerMuted, borderColor: colors.danger + '22' }]}
            onPress={() => Alert.alert('Report Card', 'Contact support@zivo.app immediately if your card has been compromised.', [{ text: 'OK' }])}
          >
            <Shield size={16} color={colors.danger} />
            <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Report Card Compromised</Text>
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
  cardWrapper: {
    borderRadius: 20, padding: 24, marginBottom: 16,
    overflow: 'hidden', position: 'relative', borderWidth: 1,
  },
  cardLockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  cardLockedText: {
    color: 'rgba(255,255,255,0.6)', fontSize: 16,
    fontWeight: '600' as const, marginTop: 10,
  },
  cardChip: {
    position: 'absolute', top: 60, left: 24,
    width: 40, height: 30, borderRadius: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  cardContactless: {
    position: 'absolute', top: 62, left: 72,
    transform: [{ rotate: '90deg' }],
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 44, marginTop: 4,
  },
  cardLogo: { fontSize: 22, fontWeight: '900' as const, letterSpacing: 4 },
  cardTypeBadge: {
    color: 'rgba(255,255,255,0.25)', fontSize: 10,
    fontWeight: '600' as const, letterSpacing: 3,
  },
  cardNumberRow: { marginBottom: 24 },
  cardNumber: {
    color: 'rgba(255,255,255,0.8)', fontSize: 20,
    fontWeight: '500' as const, letterSpacing: 3,
  },
  cardDetailsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 20,
  },
  cardDetailsRight: { flexDirection: 'row', gap: 24, alignItems: 'flex-end' },
  cardLabel: {
    color: 'rgba(255,255,255,0.2)', fontSize: 8,
    fontWeight: '600' as const, letterSpacing: 1, marginBottom: 3,
  },
  cardValue: {
    color: 'rgba(255,255,255,0.6)', fontSize: 13,
    fontWeight: '600' as const, letterSpacing: 1,
  },
  cardNetworkRow: { flexDirection: 'row' },
  cardNetworkCircle1: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(235, 80, 60, 0.6)',
  },
  cardNetworkCircle2: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255, 170, 0, 0.6)',
    marginLeft: -8,
  },
  quickActions: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, borderWidth: 1,
  },
  actionText: { fontSize: 11, fontWeight: '700' as const },
  infoCard: {
    borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6,
  },
  infoDivider: { height: 1, marginVertical: 4 },
  infoText: { fontSize: 13, fontWeight: '500' as const, flex: 1 },
  customizeBtn: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderRadius: 14,
    borderWidth: 1, marginBottom: 16,
  },
  customizeText: { fontSize: 14, fontWeight: '600' as const },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '600' as const },
});
