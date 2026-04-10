import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By creating an account or using Zivo Cycles ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.\n\nIf you are under 18 years of age, you must have your parent or guardian's approval to use this App. Parent/guardian approval is required before teen accounts can access full features.`,
  },
  {
    title: '2. Account Registration',
    content: `To use Zivo Cycles, you must:\n\n• Provide accurate and complete registration information\n• Be at least 13 years of age\n• Maintain the security of your account credentials\n• Notify us immediately of unauthorized account access\n\nYou are responsible for all activity under your account. One person may only maintain one account.`,
  },
  {
    title: '3. Savings Cycles',
    content: `Zivo Cycles provides tools for structured savings goals. Important terms:\n\n• Cycles are savings goals, not investment products\n• Contributions are tracked within the App for organizational purposes\n• Group cycles require all members to agree to the cycle terms\n• Cycle owners can invite and manage members\n• The App does not hold, manage, or invest your funds\n\nZivo is a planning and tracking tool. All actual financial transactions occur through your connected payment methods.`,
  },
  {
    title: '4. Contributions & Withdrawals',
    content: `• Contributions are voluntary commitments you track in the App\n• Emergency withdrawals may impact your discipline score\n• Teen account withdrawals require parent/guardian approval\n• We do not charge fees for contributions or withdrawals\n• You are responsible for ensuring sufficient funds in your connected accounts`,
  },
  {
    title: '5. Group Cycles',
    content: `When participating in group cycles (Family, Community):\n\n• You consent to sharing your name and contribution activity with other members\n• Cycle owners have management privileges including adding/removing members\n• All members must comply with the agreed-upon contribution schedule\n• Disputes between members should be resolved directly; Zivo is not liable for member disagreements`,
  },
  {
    title: '6. Teen Accounts',
    content: `Special terms for users under 18:\n\n• Parent or guardian must approve the account via email verification\n• Parents can monitor all account activity\n• Withdrawals require parental approval\n• Parents may revoke account access at any time\n• Teen accounts have spending and contribution limits\n• We comply with COPPA and applicable child protection laws`,
  },
  {
    title: '7. Payment Methods',
    content: `• You may connect bank accounts or debit/credit cards\n• Payment information is encrypted and securely stored\n• We use industry-standard security practices\n• You authorize us to verify your payment methods\n• We are not responsible for fees charged by your financial institution`,
  },
  {
    title: '8. Limitation of Liability',
    content: `Zivo Cycles is provided "as is" without warranties of any kind. We are not liable for:\n\n• Financial losses or missed savings goals\n• Unauthorized access to your account\n• Service interruptions or data loss\n• Actions of other cycle members\n• Third-party payment processing errors\n\nOur total liability shall not exceed the amount you paid us in the 12 months prior to the claim.`,
  },
  {
    title: '9. Contact Information',
    content: `For questions about these Terms:\n\nEmail: legal@zivo.app\nSupport: support@zivo.app\n\nThese Terms were last updated on March 1, 2026.`,
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.topBanner, { backgroundColor: colors.card, borderColor: colors.green + '15' }]}>
            <View style={[styles.bannerIcon, { backgroundColor: colors.greenMuted }]}>
              <FileText size={24} color={colors.green} />
            </View>
            <Text style={[styles.bannerTitle, { color: colors.text }]}>Terms of Service</Text>
            <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
              Please read these terms carefully before using Zivo Cycles. By using our service, you agree to these terms.
            </Text>
          </View>

          {SECTIONS.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{section.content}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '600' as const },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  topBanner: { borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1 },
  bannerIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bannerTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 8 },
  bannerText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 10 },
  sectionContent: { fontSize: 14, lineHeight: 22 },
});
