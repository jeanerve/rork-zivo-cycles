import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Mail, Phone, Shield, Eye, DollarSign, Send, UserMinus, Clock, CheckCircle, AlertCircle, Copy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Member, MemberPermission } from '@/types';

interface MemberDetailSheetProps {
  visible: boolean;
  member: Member | null;
  isOwner: boolean;
  onClose: () => void;
  onResendInvite: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
  onUpdatePermissions: (memberId: string, permissions: MemberPermission[]) => void;
}

function getStatusConfig(status?: string) {
  switch (status) {
    case 'accepted':
      return { label: 'Accepted', color: Colors.green, bg: Colors.greenMuted, icon: <CheckCircle size={14} color={Colors.green} /> };
    case 'declined':
      return { label: 'Declined', color: Colors.danger, bg: Colors.dangerMuted, icon: <AlertCircle size={14} color={Colors.danger} /> };
    default:
      return { label: 'Pending', color: Colors.warning, bg: Colors.warningMuted, icon: <Clock size={14} color={Colors.warning} /> };
  }
}

export default function MemberDetailSheet({
  visible,
  member,
  isOwner,
  onClose,
  onResendInvite,
  onRemoveMember,
  onUpdatePermissions,
}: MemberDetailSheetProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [localPermissions, setLocalPermissions] = useState<MemberPermission[]>([]);

  useEffect(() => {
    if (visible && member) {
      setLocalPermissions(member.permissions ?? ['view', 'contribute']);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, member, fadeAnim, slideAnim]);

  const handleTogglePermission = useCallback((perm: MemberPermission) => {
    if (!member || !isOwner || member.role === 'owner') return;
    if (perm === 'view') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalPermissions((prev) => {
      const updated = prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm];
      onUpdatePermissions(member.id, updated);
      return updated;
    });
  }, [member, isOwner, onUpdatePermissions]);

  const handleResend = useCallback(() => {
    if (!member) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onResendInvite(member.id);
  }, [member, onResendInvite]);

  const handleRemove = useCallback(() => {
    if (!member) return;
    Alert.alert(
      'Remove Member',
      `Remove ${member.name} from this cycle? They will lose access to the cycle.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onRemoveMember(member.id);
            onClose();
          },
        },
      ]
    );
  }, [member, onRemoveMember, onClose]);

  const handleCopyLink = useCallback(() => {
    if (!member?.inviteLink) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      void navigator.clipboard.writeText(member.inviteLink).catch(() => { /* noop */ });
    }
    Alert.alert('Link Copied', 'Invite link has been copied to clipboard.');
  }, [member]);

  if (!member) return null;

  const status = getStatusConfig(member.inviteStatus);
  const isMemberOwner = member.role === 'owner';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayTap} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          <View style={styles.profileSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
            {isMemberOwner && (
              <View style={styles.ownerBadge}>
                <Shield size={10} color={Colors.green} />
                <Text style={styles.ownerBadgeText}>Cycle Owner</Text>
              </View>
            )}
            {!isMemberOwner && (
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                {status.icon}
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            {member.email ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIconBg}>
                  <Mail size={14} color={Colors.blue} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{member.email}</Text>
                </View>
              </View>
            ) : null}
            {member.phone ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIconBg}>
                  <Phone size={14} color={Colors.teal} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{member.phone}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBg}>
                <DollarSign size={14} color={Colors.green} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Contributed</Text>
                <Text style={styles.infoValue}>${member.totalContributed.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {!isMemberOwner && isOwner && (
            <View style={styles.permissionsSection}>
              <Text style={styles.sectionLabel}>Permissions</Text>
              {[
                { key: 'view' as MemberPermission, label: 'View cycle', icon: <Eye size={14} color={Colors.blue} /> },
                { key: 'contribute' as MemberPermission, label: 'Add contributions', icon: <DollarSign size={14} color={Colors.green} /> },
                { key: 'manage' as MemberPermission, label: 'Manage settings', icon: <Shield size={14} color={Colors.orange} /> },
              ].map((perm) => {
                const isActive = localPermissions.includes(perm.key);
                const isLocked = perm.key === 'view';
                return (
                  <TouchableOpacity
                    key={perm.key}
                    style={styles.permRow}
                    onPress={() => handleTogglePermission(perm.key)}
                    disabled={isLocked}
                  >
                    {perm.icon}
                    <Text style={styles.permText}>{perm.label}</Text>
                    <View style={[styles.toggle, isActive && styles.toggleActive]}>
                      {isActive && <View style={styles.toggleDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!isMemberOwner && isOwner && (
            <View style={styles.actionsSection}>
              {member.inviteLink && (
                <TouchableOpacity style={styles.actionRow} onPress={handleCopyLink}>
                  <Copy size={16} color={Colors.textSecondary} />
                  <Text style={styles.actionText}>Copy Invite Link</Text>
                </TouchableOpacity>
              )}
              {member.inviteStatus !== 'accepted' && (
                <TouchableOpacity style={styles.actionRow} onPress={handleResend}>
                  <Send size={16} color={Colors.blue} />
                  <Text style={[styles.actionText, { color: Colors.blue }]}>Resend Invite</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionRow} onPress={handleRemove}>
                <UserMinus size={16} color={Colors.danger} />
                <Text style={[styles.actionText, { color: Colors.danger }]}>Remove Member</Text>
              </TouchableOpacity>
            </View>
          )}

          {member.inviteSentAt && (
            <Text style={styles.inviteSentNote}>
              Invite sent {new Date(member.inviteSentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </Animated.View>
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
  overlayTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderBottomWidth: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginHorizontal: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: Colors.green,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  memberName: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.greenMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownerBadgeText: {
    color: Colors.green,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500' as const,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 1,
  },
  permissionsSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  permText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  toggle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.green,
  },
  toggleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.background,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  inviteSentNote: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
