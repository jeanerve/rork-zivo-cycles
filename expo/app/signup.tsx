import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Check, Calendar, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AccountType } from '@/types';

function calculateAge(dobString: string): number {
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function isValidDate(text: string): boolean {
  const parts = text.split('/');
  if (parts.length !== 3) return false;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function dobToISO(text: string): string {
  const parts = text.split('/');
  return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
}

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dob, setDob] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateStep = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isStep1Valid = fullName.trim().length > 0 && email.includes('@') && password.length >= 6 && password === confirmPassword;
  const isStep2Valid = isValidDate(dob);

  const age = isStep2Valid ? calculateAge(dobToISO(dob)) : 0;
  const isMinor = age < 18 && age > 0;
  const accountType: AccountType = isMinor ? 'teen' : 'adult';

  const handleNext = useCallback(() => {
    if (!isStep1Valid) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
    animateStep();
  }, [isStep1Valid, animateStep]);

  const handleSignUp = useCallback(() => {
    if (!isStep2Valid) return;
    if (age < 13) {
      Alert.alert('Age Requirement', 'You must be at least 13 years old to create an account.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newUser = signUp({ name: fullName.trim(), email: email.trim().toLowerCase(), password, dateOfBirth: dobToISO(dob), accountType });
    if (isMinor && newUser) {
      router.replace('/parent-approval');
    }
  }, [isStep2Valid, age, fullName, email, password, dob, accountType, isMinor, signUp, router]);

  const handleDobChange = useCallback((text: string) => {
    setDob(formatDateInput(text));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? (setStep(0), animateStep()) : router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, { backgroundColor: step >= 0 ? colors.green : colors.surfaceLight }]} />
          <View style={[styles.stepDot, { backgroundColor: step >= 1 ? colors.green : colors.surfaceLight }]} />
        </View>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {step === 0 && (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Start your savings journey with Zivo</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" placeholderTextColor={colors.textMuted} autoCapitalize="words" testID="signup-name" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} testID="signup-email" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                  <View style={[styles.passwordRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <TextInput style={[styles.passwordInput, { color: colors.text }]} value={password} onChangeText={setPassword} placeholder="Min 6 characters" placeholderTextColor={colors.textMuted} secureTextEntry={!showPassword} testID="signup-password" />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
                  <View style={[styles.passwordRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <TextInput style={[styles.passwordInput, { color: colors.text }]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" placeholderTextColor={colors.textMuted} secureTextEntry={!showConfirm} testID="signup-confirm-password" />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                      {showConfirm ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <View style={styles.matchRow}>
                      <Check size={14} color={colors.green} />
                      <Text style={[styles.matchText, { color: colors.green }]}>Passwords match</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: isStep1Valid ? colors.green : colors.surfaceLight }]}
                  onPress={handleNext}
                  disabled={!isStep1Valid}
                  activeOpacity={0.8}
                  testID="signup-next"
                >
                  <Text style={[styles.submitText, { color: isStep1Valid ? colors.background : colors.textMuted }]}>Continue</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 1 && (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Date of Birth</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>We need your age to set up the right account type</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Date of Birth</Text>
                  <View style={[styles.dobRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Calendar size={20} color={colors.textMuted} />
                    <TextInput style={[styles.dobInput, { color: colors.text }]} value={dob} onChangeText={handleDobChange} placeholder="MM/DD/YYYY" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={10} testID="signup-dob" />
                  </View>
                </View>

                {isStep2Valid && isMinor && (
                  <View style={[styles.teenNotice, { backgroundColor: colors.warningMuted, borderColor: colors.warning + '22' }]}>
                    <ShieldAlert size={20} color={colors.warning} />
                    <View style={styles.teenNoticeContent}>
                      <Text style={[styles.teenNoticeTitle, { color: colors.warning }]}>Teen Account</Text>
                      <Text style={[styles.teenNoticeText, { color: colors.textSecondary }]}>
                        Since you're under 18, a teen account will be created. You'll need parent or guardian approval to use all features.
                      </Text>
                    </View>
                  </View>
                )}

                {isStep2Valid && !isMinor && age >= 13 && (
                  <View style={[styles.adultNotice, { backgroundColor: colors.greenMuted, borderColor: colors.green + '22' }]}>
                    <Check size={18} color={colors.green} />
                    <Text style={[styles.adultNoticeText, { color: colors.textSecondary }]}>Full adult account — all features available</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: isStep2Valid ? colors.green : colors.surfaceLight }]}
                  onPress={handleSignUp}
                  disabled={!isStep2Valid}
                  activeOpacity={0.8}
                  testID="signup-submit"
                >
                  <Text style={[styles.submitText, { color: isStep2Valid ? colors.background : colors.textMuted }]}>
                    {isMinor ? 'Create Teen Account' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.switchRow} onPress={() => router.replace('/login')}>
              <Text style={[styles.switchText, { color: colors.textMuted }]}>Already have an account? </Text>
              <Text style={[styles.switchLink, { color: colors.green }]}>Log In</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stepRow: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 24, height: 4, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800' as const, marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600' as const, marginBottom: 8 },
  input: { borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1 },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 16 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  matchText: { fontSize: 12, fontWeight: '500' as const },
  dobRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, gap: 12 },
  dobInput: { flex: 1, paddingVertical: 16, fontSize: 18, fontWeight: '600' as const, letterSpacing: 1 },
  teenNotice: { flexDirection: 'row', borderRadius: 14, padding: 16, gap: 12, marginBottom: 24, borderWidth: 1 },
  teenNoticeContent: { flex: 1 },
  teenNoticeTitle: { fontSize: 15, fontWeight: '700' as const, marginBottom: 4 },
  teenNoticeText: { fontSize: 13, lineHeight: 19 },
  adultNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1 },
  adultNoticeText: { fontSize: 13, flex: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  submitText: { fontSize: 17, fontWeight: '700' as const },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '600' as const },
});
