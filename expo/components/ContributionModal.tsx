import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check, DollarSign } from 'lucide-react-native';
import Colors from '@/constants/colors';

const QUICK_AMOUNTS = [25, 50, 100, 200];

interface ContributionModalProps {
  visible: boolean;
  cycleName: string;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export default React.memo(function ContributionModal({ visible, cycleName, onClose, onConfirm }: ContributionModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount('');
      setSelectedQuick(null);
      setShowSuccess(false);
      successAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 100, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, successAnim]);

  const selectQuick = useCallback((value: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuick(value);
    setAmount(value.toString());
  }, []);

  const handleConfirm = useCallback(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true }).start();

    setTimeout(() => {
      onConfirm(numAmount);
      setShowSuccess(false);
      onClose();
    }, 1200);
  }, [amount, onConfirm, onClose, successAnim]);

  const isValid = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            {showSuccess ? (
              <Animated.View style={[styles.successContainer, { transform: [{ scale: successAnim }] }]}>
                <View style={styles.successCircle}>
                  <Check size={36} color={Colors.background} strokeWidth={3} />
                </View>
                <Text style={styles.successText}>+${parseFloat(amount).toLocaleString()}</Text>
                <Text style={styles.successSubtext}>Added to {cycleName}</Text>
              </Animated.View>
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Add Contribution</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sheetSubtitle}>Contributing to {cycleName}</Text>

                <View style={styles.inputContainer}>
                  <DollarSign size={28} color={Colors.green} />
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => {
                      setAmount(text.replace(/[^0-9.]/g, ''));
                      setSelectedQuick(null);
                    }}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    autoFocus
                    testID="contribution-amount-input"
                  />
                </View>

                <View style={styles.quickRow}>
                  {QUICK_AMOUNTS.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.quickBtn, selectedQuick === q && styles.quickBtnActive]}
                      onPress={() => selectQuick(q)}
                    >
                      <Text style={[styles.quickBtnText, selectedQuick === q && styles.quickBtnTextActive]}>
                        ${q}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.confirmBtn, !isValid && styles.confirmBtnDisabled]}
                  onPress={handleConfirm}
                  disabled={!isValid}
                  testID="confirm-contribution-btn"
                >
                  <Text style={[styles.confirmBtnText, !isValid && styles.confirmBtnTextDisabled]}>
                    Contribute ${amount || '0'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeBtn: {
    padding: 4,
  },
  sheetSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 36,
    fontWeight: '800' as const,
    marginLeft: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  quickBtnActive: {
    backgroundColor: Colors.greenMuted,
    borderColor: Colors.green,
  },
  quickBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  quickBtnTextActive: {
    color: Colors.green,
  },
  confirmBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  confirmBtnText: {
    color: Colors.background,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  confirmBtnTextDisabled: {
    color: Colors.textMuted,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    color: Colors.green,
    fontSize: 36,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  successSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
