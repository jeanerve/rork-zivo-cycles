import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Lock, Shield, Smartphone, Globe, ChevronRight, Sun, Moon, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useSecurity } from '@/providers/SecurityProvider';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { settings: securitySettings } = useSecurity();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleToggleNotifications = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(v => !v);
  }, []);

  const handleToggleTheme = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  }, [toggleTheme]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Display</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? colors.purpleMuted : colors.orangeMuted }]}>
                {isDark ? <Moon size={16} color={colors.purple} /> : <Sun size={16} color={colors.orange} />}
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleToggleTheme}
                trackColor={{ false: colors.surfaceLight, true: colors.green + '44' }}
                thumbColor={isDark ? colors.green : colors.textMuted}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notifications</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.blueMuted }]}>
                <Bell size={16} color={colors.blue} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Get reminders for contributions</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.surfaceLight, true: colors.green + '44' }}
                thumbColor={notificationsEnabled ? colors.green : colors.textMuted}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Security</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/security-setup')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.greenMuted }]}>
                <Lock size={16} color={colors.green} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>PIN Code</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  {securitySettings.pinEnabled ? '4-digit PIN active' : 'Set up a PIN'}
                </Text>
              </View>
              {securitySettings.pinEnabled ? (
                <View style={[styles.activeBadge, { backgroundColor: colors.greenMuted }]}>
                  <Text style={[styles.activeText, { color: colors.green }]}>Active</Text>
                </View>
              ) : (
                <ChevronRight size={16} color={colors.textMuted} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/security-setup')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.blueMuted }]}>
                <Fingerprint size={16} color={colors.blue} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Biometric Login</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  {securitySettings.biometricEnabled ? 'Face ID / Fingerprint active' : 'Use Face ID or fingerprint'}
                </Text>
              </View>
              {securitySettings.biometricEnabled ? (
                <View style={[styles.activeBadge, { backgroundColor: colors.greenMuted }]}>
                  <Text style={[styles.activeText, { color: colors.green }]}>Active</Text>
                </View>
              ) : (
                <ChevronRight size={16} color={colors.textMuted} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Alert.alert('Change Password', 'A password reset link will be sent to your email.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send Link', onPress: () => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
                }},
              ])}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.orangeMuted }]}>
                <Shield size={16} color={colors.orange} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Update your account password</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Preferences</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.tealMuted }]}>
                <Globe size={16} color={colors.teal} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Language</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>English (US)</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.blueMuted }]}>
                <Smartphone size={16} color={colors.blue} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Currency</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>USD ($)</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.accountValue, { color: colors.text }]}>{user?.email ?? 'N/A'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>Account Type</Text>
              <Text style={[styles.accountValue, { color: colors.text }]}>{user?.accountType === 'teen' ? 'Teen' : 'Adult'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>Member Since</Text>
              <Text style={[styles.accountValue, { color: colors.text }]}>
                {user?.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: colors.dangerMuted, borderColor: colors.danger + '22' }]}
            onPress={() => Alert.alert('Delete Account', 'This will permanently delete your account and all data. This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account Deletion', 'Please email support@zivo.app to process account deletion.') },
            ])}
          >
            <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Delete Account</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: colors.textMuted }]}>Zivo Cycles v1.0.0</Text>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },
  settingCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accountLabel: {
    fontSize: 14,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dangerBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
