import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, UserPlus, Mail, Phone, User, Shield, Eye, DollarSign } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { MemberPermission } from '@/types';

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (member: {
    name: string;
    email: string;
    phone: string;
    permissions: MemberPermission[];
  }) => void;
  cycleType: string;
}

const PERMISSION_OPTIONS: { key: MemberPermission; label: string; description: string; icon: React.ReactNode }[] = [
  { key: 'view', label: 'View', description: 'Can see cycle progress', icon: <Eye size={16} color={Colors.blue} /> },
  { key: 'contribute', label: 'Contribute', description: 'Can add contributions', icon: <DollarSign size={16} color={Colors.green} /> },
  { key: 'manage', label: 'Manage', description: 'Can edit cycle settings', icon: <Shield size={16} color={Colors.orange} /> },
];

export default function InviteMemberModal({ visible, onClose, onAdd, cycleType }: InviteMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [permissions, setPermissions] = useState<MemberPermission[]>(['view', 'contribute']);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      setName('');
      setEmail('');
      setPhone('');
      setPermissions(['view', 'contribute']);
    }
  }, [visible, fadeAnim, slideAnim]);

  const togglePermission = useCallback((perm: MemberPermission) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPermissions((prev) => {
      if (prev.includes(perm)) {
        if (perm === 'view') return prev;
        return prev.filter((p) => p !== perm);
      }
      return [...prev, perm];
    });
  }, []);

  const handleAdd = useCallback(() => {
    if (!name.trim() || !email.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      permissions,
    });
    onClose();
  }, [name, email, phone, permissions, onAdd, onClose]);

  const isValid = name.trim().length > 0 && email.trim().length > 0 && email.includes('@');

  const getRoleHint = () => {
    switch (cycleType) {
      case 'family': return 'Family Member';
      case 'community': return 'Community Member';
      default: return 'Member';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.sheetIconCircle}>
                  <UserPlus size={18} color={Colors.green} />
                </View>
                <Text style={styles.sheetTitle}>Add {getRoleHint()}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <View style={styles.inputRow}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter full name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  testID="invite-name-input"
                />
              </View>

              <Text style={styles.fieldLabel}>Email Address *</Text>
              <View style={styles.inputRow}>
                <Mail size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="invite-email-input"
                />
              </View>

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.inputRow}>
                <Phone size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  testID="invite-phone-input"
                />
              </View>

              <Text style={styles.sectionLabel}>Permissions</Text>
              <Text style={styles.sectionHint}>Control what this member can do in the cycle</Text>

              {PERMISSION_OPTIONS.map((opt) => {
                const isActive = permissions.includes(opt.key);
                const isLocked = opt.key === 'view';
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.permRow, isActive && styles.permRowActive]}
                    onPress={() => togglePermission(opt.key)}
                    disabled={isLocked}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.permIcon, isActive && styles.permIconActive]}>
                      {opt.icon}
                    </View>
                    <View style={styles.permInfo}>
                      <Text style={[styles.permLabel, isActive && styles.permLabelActive]}>{opt.label}</Text>
                      <Text style={styles.permDesc}>{opt.description}</Text>
                    </View>
                    <View style={[styles.permToggle, isActive && styles.permToggleActive]}>
                      {isActive && <View style={styles.permToggleDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.inviteNote}>
                <Mail size={14} color={Colors.green} />
                <Text style={styles.inviteNoteText}>
                  An invite link will be sent to their email{phone.trim() ? ' and phone' : ''} after the cycle is created.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={[styles.addBtn, !isValid && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!isValid}
                testID="confirm-add-member"
              >
                <UserPlus size={18} color={isValid ? Colors.background : Colors.textMuted} />
                <Text style={[styles.addBtnText, !isValid && styles.addBtnTextDisabled]}>
                  Add & Send Invite
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderBottomWidth: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 22,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  permRowActive: {
    borderColor: Colors.green + '44',
    backgroundColor: Colors.greenSoft,
  },
  permIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permIconActive: {
    backgroundColor: Colors.greenMuted,
  },
  permInfo: {
    flex: 1,
  },
  permLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  permLabelActive: {
    color: Colors.green,
  },
  permDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  permToggle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permToggleActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.green,
  },
  permToggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
  },
  inviteNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.greenSoft,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
  },
  inviteNoteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  addBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  addBtnText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  addBtnTextDisabled: {
    color: Colors.textMuted,
  },
});
