import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldCheck, Mail, Send, CheckCircle, Clock, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';

function encodeMailto(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ParentApprovalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, requestParentApproval } = useAuth();
  const { colors } = useTheme();

  const [parentEmail, setParentEmail] = useState(user?.parentEmail ?? '');
  const [sent, setSent] = useState(user?.parentApprovalStatus === 'pending');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSendRequest = useCallback(async () => {
    if (!parentEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid parent/guardian email address.');
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    requestParentApproval(parentEmail.trim().toLowerCase());
    setSent(true);

    const approvalToken = `${user?.id ?? 'unknown'}-${Date.now().toString(36)}`;
    const approvalLink = `https://zivo.app/approve/${approvalToken}`;

    const subject = `Zivo — Parental Approval Request for ${user?.name ?? 'Your Child'}`;
    const body = [
      `Dear Parent/Guardian,`,
      '',
      `${user?.name ?? 'Your child'} has created a teen account on Zivo Cycles and needs your approval to use the app.`,
      '',
      `Account Details:`,
      `— Name: ${user?.name ?? 'N/A'}`,
      `— Email: ${user?.email ?? 'N/A'}`,
      `— Account Type: Teen`,
      `— Date of Birth: ${user?.dateOfBirth ?? 'N/A'}`,
      '',
      `Zivo Cycles is a financial literacy app that helps teens learn discipline through structured savings cycles.`,
      '',
      `To approve your child's account, click the link below:`,
      approvalLink,
      '',
      `If you did not expect this request, you can safely ignore this email.`,
      '',
      `Thank you,`,
      `The Zivo Team`,
    ].join('\n');

    const url = encodeMailto(parentEmail.trim(), subject, body);

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        console.log('[ParentApproval] Email opened for:', parentEmail);
      }
    } catch (error) {
      console.log('[ParentApproval] Error opening email:', error);
    }
  }, [parentEmail, user, requestParentApproval]);

  const handleSkipForNow = useCallback(() => {
    router.replace('/(tabs)/(home)');
  }, [router]);

  const isApproved = user?.parentApprovalStatus === 'approved';
  const isPending = user?.parentApprovalStatus === 'pending' || sent;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: colors.greenMuted, borderColor: colors.green + '33' }]}>
                <ShieldCheck size={36} color={colors.green} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Parent Approval</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Since you're under 18, we need your parent or guardian to approve your account before you can use all Zivo features.
            </Text>

            {!isPending && !isApproved && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Parent/Guardian Email</Text>
                  <View style={[styles.emailRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Mail size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.emailInput, { color: colors.text }]}
                      value={parentEmail}
                      onChangeText={setParentEmail}
                      placeholder="parent@email.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      testID="parent-email-input"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: parentEmail.includes('@') ? colors.green : colors.surfaceLight }]}
                  onPress={handleSendRequest}
                  disabled={!parentEmail.includes('@')}
                  activeOpacity={0.8}
                  testID="send-approval-btn"
                >
                  <Send size={18} color={parentEmail.includes('@') ? colors.background : colors.textMuted} />
                  <Text style={[styles.sendBtnText, { color: parentEmail.includes('@') ? colors.background : colors.textMuted }]}>
                    Request Parent Approval
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isPending && !isApproved && (
              <View style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.warning + '22' }]}>
                <View style={styles.pendingIconRow}>
                  <Clock size={24} color={colors.warning} />
                </View>
                <Text style={[styles.pendingTitle, { color: colors.warning }]}>Approval Pending</Text>
                <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
                  An approval email has been sent to{'\n'}
                  <Text style={[styles.pendingEmail, { color: colors.text }]}>{parentEmail || user?.parentEmail}</Text>
                </Text>
                <Text style={[styles.pendingHint, { color: colors.textMuted }]}>
                  Ask your parent to check their email and click the approval link.
                </Text>

                <TouchableOpacity style={[styles.resendBtn, { backgroundColor: colors.greenMuted }]} onPress={handleSendRequest}>
                  <Send size={14} color={colors.green} />
                  <Text style={[styles.resendBtnText, { color: colors.green }]}>Resend Email</Text>
                </TouchableOpacity>

                <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.infoBoxText, { color: colors.textMuted }]}>Only your parent or guardian can approve your account by clicking the link in their email.</Text>
                </View>
              </View>
            )}

            {isApproved && (
              <View style={[styles.approvedCard, { backgroundColor: colors.card, borderColor: colors.green + '22' }]}>
                <CheckCircle size={40} color={colors.green} />
                <Text style={[styles.approvedTitle, { color: colors.green }]}>Account Approved!</Text>
                <Text style={[styles.approvedText, { color: colors.textSecondary }]}>Your parent has approved your account. You're all set!</Text>
                <TouchableOpacity
                  style={[styles.continueBtn, { backgroundColor: colors.green }]}
                  onPress={() => router.replace('/(tabs)/(home)')}
                  testID="continue-btn"
                >
                  <Text style={[styles.continueBtnText, { color: colors.background }]}>Get Started</Text>
                  <ArrowRight size={18} color={colors.background} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipForNow}>
              <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip for now (limited access)</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  title: { fontSize: 28, fontWeight: '800' as const, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600' as const, marginBottom: 8 },
  emailRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, gap: 12 },
  emailInput: { flex: 1, paddingVertical: 16, fontSize: 16 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 16, gap: 8 },
  sendBtnText: { fontSize: 16, fontWeight: '700' as const },
  pendingCard: { borderRadius: 18, padding: 24, alignItems: 'center', borderWidth: 1 },
  pendingIconRow: { marginBottom: 14 },
  pendingTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 8 },
  pendingText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  pendingEmail: { fontWeight: '600' as const },
  pendingHint: { fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  resendBtnText: { fontSize: 13, fontWeight: '600' as const },
  infoBox: { borderRadius: 10, padding: 14, marginTop: 4 },
  infoBoxText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  approvedCard: { borderRadius: 18, padding: 28, alignItems: 'center', borderWidth: 1 },
  approvedTitle: { fontSize: 22, fontWeight: '700' as const, marginTop: 14, marginBottom: 8 },
  approvedText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, gap: 8 },
  continueBtnText: { fontSize: 16, fontWeight: '700' as const },
  skipBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 12 },
  skipText: { fontSize: 14 },
});
