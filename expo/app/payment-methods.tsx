import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, CreditCard, Building2, Trash2, Check, X, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';

type AddingType = 'bank' | 'card' | null;

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, addPaymentMethod, removePaymentMethod } = useAuth();
  const { colors } = useTheme();
  const [addingType, setAddingType] = useState<AddingType>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const methods = user?.paymentMethods ?? [];

  const resetForm = useCallback(() => {
    setBankName(''); setRoutingNumber(''); setAccountNumber('');
    setCardNumber(''); setCardExpiry(''); setCardCvv(''); setCardName('');
    setAddingType(null);
  }, []);

  const handleAddBank = useCallback(() => {
    if (!bankName.trim() || routingNumber.length < 9 || accountNumber.length < 4) {
      Alert.alert('Invalid Details', 'Please fill in all bank account fields correctly.'); return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPaymentMethod({ type: 'bank', name: bankName.trim(), last4: accountNumber.slice(-4), isDefault: methods.length === 0 });
    resetForm();
    Alert.alert('Bank Account Added', 'Your bank account has been securely connected.');
  }, [bankName, routingNumber, accountNumber, methods.length, addPaymentMethod, resetForm]);

  const handleAddCard = useCallback(() => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 15 || !cardExpiry.includes('/') || cardCvv.length < 3 || !cardName.trim()) {
      Alert.alert('Invalid Details', 'Please fill in all card fields correctly.'); return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const isDebit = digits.startsWith('4') || digits.startsWith('5');
    addPaymentMethod({ type: isDebit ? 'debit' : 'credit', name: cardName.trim(), last4: digits.slice(-4), isDefault: methods.length === 0 });
    resetForm();
    Alert.alert('Card Added', 'Your card has been securely connected.');
  }, [cardNumber, cardExpiry, cardCvv, cardName, methods.length, addPaymentMethod, resetForm]);

  const handleRemove = useCallback((id: string, name: string) => {
    Alert.alert('Remove Payment Method', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); removePaymentMethod(id); } },
    ]);
  }, [removePaymentMethod]);

  const formatCardNumber = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  }, []);

  const formatExpiry = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => addingType ? resetForm() : router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {addingType ? <X size={20} color={colors.text} /> : <ArrowLeft size={20} color={colors.text} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{addingType === 'bank' ? 'Add Bank Account' : addingType === 'card' ? 'Add Card' : 'Payment Methods'}</Text>
        <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim }}>
            {!addingType && (
              <>
                <View style={[styles.securityBanner, { backgroundColor: colors.greenSoft, borderColor: colors.green + '15' }]}>
                  <Lock size={16} color={colors.green} />
                  <Text style={[styles.securityText, { color: colors.textSecondary }]}>Your payment information is encrypted and stored securely</Text>
                </View>

                {methods.length > 0 && (
                  <View style={styles.methodsList}>
                    {methods.map((method) => (
                      <View key={method.id} style={[styles.methodCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <View style={[styles.methodIcon, { backgroundColor: method.type === 'bank' ? colors.blueMuted : colors.greenMuted }]}>
                          {method.type === 'bank' ? <Building2 size={18} color={colors.blue} /> : <CreditCard size={18} color={colors.green} />}
                        </View>
                        <View style={styles.methodInfo}>
                          <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
                          <Text style={[styles.methodDetails, { color: colors.textMuted }]}>
                            {method.type === 'bank' ? 'Bank Account' : method.type === 'debit' ? 'Debit Card' : 'Credit Card'} •••• {method.last4}
                          </Text>
                        </View>
                        {method.isDefault && (
                          <View style={[styles.defaultBadge, { backgroundColor: colors.greenMuted }]}>
                            <Text style={[styles.defaultText, { color: colors.green }]}>Default</Text>
                          </View>
                        )}
                        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(method.id, method.name)}>
                          <Trash2 size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {methods.length === 0 && (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceLight }]}>
                      <CreditCard size={36} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No payment methods</Text>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Add a bank account or card to fund your cycle contributions</Text>
                  </View>
                )}

                <Text style={[styles.addTitle, { color: colors.textMuted }]}>Add Payment Method</Text>

                <TouchableOpacity style={[styles.addOptionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAddingType('bank'); }} activeOpacity={0.7} testID="add-bank-btn">
                  <View style={[styles.addOptionIcon, { backgroundColor: colors.blueMuted }]}><Building2 size={22} color={colors.blue} /></View>
                  <View style={styles.addOptionInfo}>
                    <Text style={[styles.addOptionTitle, { color: colors.text }]}>Bank Account</Text>
                    <Text style={[styles.addOptionDesc, { color: colors.textMuted }]}>Connect your checking or savings account</Text>
                  </View>
                  <Plus size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.addOptionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAddingType('card'); }} activeOpacity={0.7} testID="add-card-btn">
                  <View style={[styles.addOptionIcon, { backgroundColor: colors.greenMuted }]}><CreditCard size={22} color={colors.green} /></View>
                  <View style={styles.addOptionInfo}>
                    <Text style={[styles.addOptionTitle, { color: colors.text }]}>Debit / Credit Card</Text>
                    <Text style={[styles.addOptionDesc, { color: colors.textMuted }]}>Add a Visa, Mastercard, or other card</Text>
                  </View>
                  <Plus size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}

            {addingType === 'bank' && (
              <>
                <View style={styles.formIcon}><Building2 size={28} color={colors.blue} /></View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Bank Name</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={bankName} onChangeText={setBankName} placeholder="e.g., Chase, Bank of America" placeholderTextColor={colors.textMuted} autoCapitalize="words" testID="bank-name-input" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Routing Number</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={routingNumber} onChangeText={(t) => setRoutingNumber(t.replace(/\D/g, '').slice(0, 9))} placeholder="9 digits" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={9} testID="routing-input" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Account Number</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={accountNumber} onChangeText={(t) => setAccountNumber(t.replace(/\D/g, '').slice(0, 17))} placeholder="Account number" placeholderTextColor={colors.textMuted} keyboardType="number-pad" secureTextEntry testID="account-input" />
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.green }]} onPress={handleAddBank} testID="submit-bank-btn">
                  <Check size={18} color={colors.background} />
                  <Text style={[styles.submitBtnText, { color: colors.background }]}>Add Bank Account</Text>
                </TouchableOpacity>
              </>
            )}

            {addingType === 'card' && (
              <>
                <View style={styles.formIcon}><CreditCard size={28} color={colors.green} /></View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Cardholder Name</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={cardName} onChangeText={setCardName} placeholder="Name on card" placeholderTextColor={colors.textMuted} autoCapitalize="words" testID="card-name-input" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Card Number</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={cardNumber} onChangeText={(t) => setCardNumber(formatCardNumber(t))} placeholder="1234 5678 9012 3456" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={19} testID="card-number-input" />
                </View>
                <View style={styles.twoCol}>
                  <View style={styles.halfGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Expiry</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={cardExpiry} onChangeText={(t) => setCardExpiry(formatExpiry(t))} placeholder="MM/YY" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={5} testID="card-expiry-input" />
                  </View>
                  <View style={styles.halfGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>CVV</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={cardCvv} onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))} placeholder="123" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={4} secureTextEntry testID="card-cvv-input" />
                  </View>
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.green }]} onPress={handleAddCard} testID="submit-card-btn">
                  <Check size={18} color={colors.background} />
                  <Text style={[styles.submitBtnText, { color: colors.background }]}>Add Card</Text>
                </TouchableOpacity>
              </>
            )}
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
  headerTitle: { fontSize: 17, fontWeight: '600' as const },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  securityBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1 },
  securityText: { fontSize: 13, flex: 1 },
  methodsList: { gap: 8, marginBottom: 24 },
  methodCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, borderWidth: 1, gap: 14 },
  methodIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 15, fontWeight: '600' as const },
  methodDetails: { fontSize: 12, marginTop: 2 },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultText: { fontSize: 10, fontWeight: '700' as const },
  removeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, marginBottom: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  addTitle: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 },
  addOptionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, marginBottom: 10, borderWidth: 1, gap: 14 },
  addOptionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addOptionInfo: { flex: 1 },
  addOptionTitle: { fontSize: 16, fontWeight: '600' as const },
  addOptionDesc: { fontSize: 12, marginTop: 2 },
  formIcon: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600' as const, marginBottom: 8 },
  input: { borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1 },
  twoCol: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  halfGroup: { flex: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 16, gap: 8, marginTop: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const },
});
