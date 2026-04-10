import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, including:\n\n• Name, email address, and date of birth when you create an account\n• Financial information such as savings goals, contribution amounts, and cycle details\n• Payment method information (bank account or card details) for processing contributions\n• Communications you send to us, including support requests\n\nWe also automatically collect certain information when you use our app, including device information, usage data, and analytics.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:\n\n• Provide, maintain, and improve Zivo Cycles\n• Process contributions and manage your savings cycles\n• Send you notifications about cycle activity, reminders, and milestones\n• Provide customer support and respond to your requests\n• Monitor and analyze trends, usage, and activities\n• Detect, investigate, and prevent fraud and other illegal activities\n• Personalize and improve your experience`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell your personal information. We may share information in the following circumstances:\n\n• With cycle members: Your name, contribution amounts, and cycle progress are visible to other members of your shared cycles\n• With service providers who help us operate our platform\n• To comply with legal obligations or protect our rights\n• With your consent or at your direction\n\nFor teen accounts, parents/guardians have access to account activity and cycle details.`,
  },
  {
    title: '4. Data Security',
    content: `We take reasonable measures to protect your personal information, including:\n\n• Encryption of data in transit and at rest\n• Secure storage of payment information\n• Regular security assessments\n• Access controls and authentication\n\nNo method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.`,
  },
  {
    title: '5. Teen Accounts & Parental Controls',
    content: `For users under 18:\n\n• A parent or guardian must approve the account\n• Parents can monitor cycle activity and contributions\n• Withdrawals require parental approval\n• Parents can revoke access at any time\n• We comply with COPPA and similar regulations\n\nWe do not knowingly collect information from children under 13 without parental consent.`,
  },
  {
    title: '6. Your Rights',
    content: `You have the right to:\n\n• Access your personal information\n• Correct inaccurate information\n• Delete your account and associated data\n• Export your data\n• Opt out of promotional communications\n\nTo exercise these rights, contact us at privacy@zivo.app.`,
  },
  {
    title: '7. Contact Us',
    content: `If you have questions about this Privacy Policy or our practices, contact us at:\n\nEmail: privacy@zivo.app\nAddress: Zivo Cycles Inc.\n\nThis policy was last updated on March 1, 2026.`,
  },
];

export default function PrivacyScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.topBanner, { backgroundColor: colors.card, borderColor: colors.green + '15' }]}>
            <View style={[styles.bannerIcon, { backgroundColor: colors.greenMuted }]}>
              <Shield size={24} color={colors.green} />
            </View>
            <Text style={[styles.bannerTitle, { color: colors.text }]}>Your Privacy Matters</Text>
            <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
              We are committed to protecting your personal information and being transparent about how we use it.
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
