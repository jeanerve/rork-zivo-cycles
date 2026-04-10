import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, User, Home, Users, GraduationCap, Calendar, DollarSign, Clock, Target, UserPlus, X, Edit2, UserMinus, Mail, Phone, Send, ChevronRight, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors, { CycleTypeColors, CycleTypeBgColors } from '@/constants/colors';
import { useCycles } from '@/providers/CyclesProvider';
import { useAuth } from '@/providers/AuthProvider';
import { CycleType, ContributionFrequency, CyclePlan, Member, MemberPermission } from '@/types';
import { CYCLE_TYPE_INFO } from '@/mocks/data';
import InviteMemberModal from '@/components/InviteMemberModal';

const FREQUENCY_OPTIONS: { label: string; value: ContributionFrequency; periodsPerMonth: number }[] = [
  { label: 'Daily', value: 'daily', periodsPerMonth: 30 },
  { label: 'Weekly', value: 'weekly', periodsPerMonth: 4.33 },
  { label: 'Bi-weekly', value: 'biweekly', periodsPerMonth: 2.17 },
  { label: 'Monthly', value: 'monthly', periodsPerMonth: 1 },
];

const DURATION_OPTIONS = [
  { label: '1 Month', months: 1 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '1 Year', months: 12 },
];

const GROUP_CYCLE_TYPES: CycleType[] = ['family', 'community'];

function isGroupCycle(type: CycleType | null): boolean {
  return type !== null && GROUP_CYCLE_TYPES.includes(type);
}

function getCycleIcon(type: CycleType, color: string) {
  const size = 24;
  switch (type) {
    case 'individual': return <User size={size} color={color} />;
    case 'family': return <Home size={size} color={color} />;
    case 'community': return <Users size={size} color={color} />;
    case 'teen': return <GraduationCap size={size} color={color} />;
  }
}

function calculatePlan(goalAmount: number, frequency: ContributionFrequency, durationMonths: number, memberCount: number): CyclePlan {
  const freqOption = FREQUENCY_OPTIONS.find(f => f.value === frequency);
  const periodsPerMonth = freqOption?.periodsPerMonth ?? 4.33;
  const totalContributions = Math.ceil(periodsPerMonth * durationMonths);
  const contributionAmount = Math.ceil((goalAmount / totalContributions) * 100) / 100;
  const contributionPerPerson = memberCount > 0 ? Math.ceil((contributionAmount / memberCount) * 100) / 100 : contributionAmount;

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  return {
    contributionAmount,
    contributionPerPerson,
    totalContributions,
    estimatedEndDate: endDate.toISOString().split('T')[0],
    frequency,
    goalAmount,
    currentAmount: 0,
    remainingAmount: goalAmount,
    remainingContributions: totalContributions,
    memberCount,
  };
}

function generateMemberAvatar(name: string): string {
  const colors = ['3B82F6', 'A855F7', '14B8A6', 'F97316', 'EF4444', 'F59E0B', '06B6D4', 'EC4899'];
  const index = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[index]}&color=fff&size=200&bold=true`;
}

export default function CreateCycleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createCycle } = useCycles();
  const { user } = useAuth();

  const isTeen = user?.accountType === 'teen';
  const isTeenApproved = user?.parentApprovalStatus === 'approved';

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<CycleType | null>(null);
  const [name, setName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [frequency, setFrequency] = useState<ContributionFrequency>('weekly');
  const [duration, setDuration] = useState(3);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [motivation, setMotivation] = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = isGroupCycle(selectedType) ? 5 : 4;

  const memberCount = members.length + 1;

  const plan = useMemo(() => {
    const amount = parseFloat(goalAmount || '0');
    if (amount <= 0) return null;
    return calculatePlan(amount, frequency, duration, memberCount);
  }, [goalAmount, frequency, duration, memberCount]);

  const animateStep = useCallback((direction: number) => {
    slideAnim.setValue(direction * 30);
    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  }, [slideAnim]);

  const nextStep = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
    animateStep(1);
  }, [animateStep]);

  const prevStep = useCallback(() => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
    animateStep(-1);
  }, [step, router, animateStep]);

  const addMember = useCallback(() => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    const member: Member = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      avatar: generateMemberAvatar(trimmed),
      totalContributed: 0,
      role: 'member',
      permissions: ['view', 'contribute'],
    };

    setMembers((prev) => [...prev, member]);
    setNewMemberName('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [newMemberName]);

  const addMemberDetailed = useCallback((data: {
    name: string;
    email: string;
    phone: string;
    permissions: MemberPermission[];
  }) => {
    const member: Member = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      avatar: generateMemberAvatar(data.name),
      totalContributed: 0,
      role: 'member',
      inviteStatus: 'pending',
      permissions: data.permissions,
    };

    setMembers((prev) => [...prev, member]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const removeMember = useCallback((memberId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }, []);

  const startEditMember = useCallback((member: Member) => {
    setEditingMemberId(member.id);
    setEditingMemberName(member.name);
  }, []);

  const saveEditMember = useCallback(() => {
    if (!editingMemberId || !editingMemberName.trim()) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === editingMemberId
          ? { ...m, name: editingMemberName.trim(), avatar: generateMemberAvatar(editingMemberName.trim()) }
          : m
      )
    );
    setEditingMemberId(null);
    setEditingMemberName('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [editingMemberId, editingMemberName]);

  const cancelEditMember = useCallback(() => {
    setEditingMemberId(null);
    setEditingMemberName('');
  }, []);

  const handleCreate = useCallback(() => {
    if (!selectedType || !name.trim() || !goalAmount) return;

    if (isTeen && !isTeenApproved) {
      Alert.alert(
        'Parent Approval Required',
        'You need parent approval before you can create a cycle. Go to Profile to request parent approval.',
        [{ text: 'OK' }]
      );
      return;
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    createCycle({
      name: name.trim(),
      type: selectedType,
      goalAmount: parseFloat(goalAmount),
      endDate: endDate.toISOString().split('T')[0],
      frequency,
      members: isGroupCycle(selectedType) ? members : undefined,
      purpose: purpose.trim() || undefined,
      motivation: motivation.trim() || undefined,
    });

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const invitableCount = members.filter((m) => m.email).length;
    if (invitableCount > 0) {
      Alert.alert(
        'Cycle Created & Invites Sent',
        `Your cycle has been created. Invites and the cycle plan have been sent to ${invitableCount} member${invitableCount !== 1 ? 's' : ''}.`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } else {
      router.back();
    }
  }, [selectedType, name, goalAmount, duration, frequency, members, createCycle, router, isTeen, isTeenApproved, purpose, motivation]);

  const canProceed = () => {
    if (step === 0) return selectedType !== null;
    if (step === 1) return name.trim().length > 0 && parseFloat(goalAmount) > 0;
    if (step === 2) return purpose.trim().length > 0;
    if (step === 3 && isGroupCycle(selectedType)) return members.length > 0;
    return true;
  };

  const getStepForReview = () => {
    if (isGroupCycle(selectedType)) return 4;
    return 3;
  };

  const isReviewStep = step === getStepForReview();
  const isPurposeStep = step === 2;
  const isMembersStep = step === 3 && isGroupCycle(selectedType);

  const typeKeys = Object.keys(CYCLE_TYPE_INFO) as CycleType[];

  const formatFrequency = (freq: ContributionFrequency) => {
    switch (freq) {
      case 'daily': return 'day';
      case 'weekly': return 'week';
      case 'biweekly': return '2 weeks';
      case 'monthly': return 'month';
    }
  };

  const formatEndDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getMemberRoleLabel = (type: CycleType | null): string => {
    switch (type) {
      case 'family': return 'Family Members';
      case 'community': return 'Community Members';
      default: return 'Members';
    }
  };

  const getMemberPlaceholder = (type: CycleType | null): string => {
    switch (type) {
      case 'family': return 'e.g., Sarah, Mom, Dad...';
      case 'community': return 'e.g., John, Maria, David...';
      default: return 'Enter member name';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[styles.flex, { transform: [{ translateX: slideAnim }] }]}>
          {step === 0 && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose Cycle Type</Text>
              <Text style={styles.stepSubtitle}>Select the type of savings cycle you want to create</Text>

              {typeKeys.map((type) => {
                const info = CYCLE_TYPE_INFO[type];
                const color = CycleTypeColors[type] ?? Colors.green;
                const bg = CycleTypeBgColors[type] ?? Colors.greenMuted;
                const isSelected = selectedType === type;

                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeCard, isSelected && { borderColor: color }]}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedType(type);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIconBg, { backgroundColor: bg }]}>
                      {getCycleIcon(type, color)}
                    </View>
                    <View style={styles.typeInfo}>
                      <View style={styles.typeLabelRow}>
                        <Text style={styles.typeLabel}>{info.label}</Text>
                        {GROUP_CYCLE_TYPES.includes(type) && (
                          <View style={[styles.groupBadge, { backgroundColor: bg }]}>
                            <Users size={10} color={color} />
                            <Text style={[styles.groupBadgeText, { color }]}>Group</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.typeDesc}>{info.description}</Text>
                      <View style={styles.examplesRow}>
                        {info.examples.map((ex) => (
                          <View key={ex} style={[styles.exampleTag, { backgroundColor: bg }]}>
                            <Text style={[styles.exampleText, { color }]}>{ex}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: color }]}>
                        <Check size={14} color={Colors.background} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {isPurposeStep && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>Your Purpose</Text>
              <Text style={styles.stepSubtitle}>Make your cycle meaningful — define why you're saving</Text>

              <Text style={styles.inputLabel}>What are you saving for?</Text>
              <TextInput
                style={styles.textInput}
                value={purpose}
                onChangeText={setPurpose}
                placeholder="e.g., My first car, Dream vacation, Emergency fund"
                placeholderTextColor={Colors.textMuted}
                testID="purpose-input"
              />

              <Text style={styles.inputLabel}>Why does it matter to you?</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 100, textAlignVertical: 'top' as const }]}
                value={motivation}
                onChangeText={setMotivation}
                placeholder="This will keep you motivated when it gets hard..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                testID="motivation-input"
              />

              <View style={[styles.purposeHint, { backgroundColor: Colors.greenMuted, borderColor: Colors.green + '22' }]}>
                <Text style={[styles.purposeHintTitle, { color: Colors.green }]}>Why this matters</Text>
                <Text style={[styles.purposeHintText, { color: Colors.textMuted }]}>
                  Research shows that defining your "why" makes you 2x more likely to reach your savings goal.
                </Text>
              </View>
            </ScrollView>
          )}

          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>Set Your Goal</Text>
              <Text style={styles.stepSubtitle}>Define your savings target and timeline</Text>

              <Text style={styles.inputLabel}>Cycle Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor={Colors.textMuted}
                testID="cycle-name-input"
              />

              <Text style={styles.inputLabel}>Goal Amount</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={goalAmount}
                  onChangeText={(t) => setGoalAmount(t.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  testID="goal-amount-input"
                />
              </View>

              <Text style={styles.inputLabel}>Contribution Frequency</Text>
              <View style={styles.optionsRow}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionChip, frequency === opt.value && styles.optionChipActive]}
                    onPress={() => setFrequency(opt.value)}
                  >
                    <Text style={[styles.optionChipText, frequency === opt.value && styles.optionChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Duration</Text>
              <View style={styles.optionsRow}>
                {DURATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.months}
                    style={[styles.optionChip, duration === opt.months && styles.optionChipActive]}
                    onPress={() => setDuration(opt.months)}
                  >
                    <Text style={[styles.optionChipText, duration === opt.months && styles.optionChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {plan && (
                <View style={styles.planPreview}>
                  <View style={styles.planHeader}>
                    <Target size={16} color={Colors.green} />
                    <Text style={styles.planTitle}>Your Payment Plan</Text>
                  </View>
                  <View style={styles.planHighlight}>
                    <Text style={styles.planAmount}>${plan.contributionAmount.toFixed(2)}</Text>
                    <Text style={styles.planFreq}>per {formatFrequency(frequency)}</Text>
                  </View>
                  <Text style={styles.planDetail}>{plan.totalContributions} contributions to reach your goal</Text>
                  {isGroupCycle(selectedType) && (
                    <Text style={styles.planDetailMuted}>Add members in the next step to split contributions</Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {isMembersStep && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>Add {getMemberRoleLabel(selectedType)}</Text>
              <Text style={styles.stepSubtitle}>
                Add people to this {selectedType} cycle. They'll receive an invite with the cycle plan.
              </Text>

              <TouchableOpacity
                style={styles.inviteDetailedBtn}
                onPress={() => setShowInviteModal(true)}
                activeOpacity={0.7}
                testID="invite-member-btn"
              >
                <View style={styles.inviteDetailedIcon}>
                  <UserPlus size={18} color={Colors.green} />
                </View>
                <View style={styles.inviteDetailedInfo}>
                  <Text style={styles.inviteDetailedTitle}>Invite Member</Text>
                  <Text style={styles.inviteDetailedDesc}>Add name, email & phone to send invite</Text>
                </View>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.quickAddSection}>
                <Text style={styles.quickAddLabel}>Or quick add by name</Text>
                <View style={styles.addMemberInputRow}>
                  <TextInput
                    style={styles.addMemberInput}
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                    placeholder={getMemberPlaceholder(selectedType)}
                    placeholderTextColor={Colors.textMuted}
                    onSubmitEditing={addMember}
                    returnKeyType="done"
                    testID="member-name-input"
                  />
                  <TouchableOpacity
                    style={[styles.addMemberBtn, !newMemberName.trim() && styles.addMemberBtnDisabled]}
                    onPress={addMember}
                    disabled={!newMemberName.trim()}
                    testID="add-member-btn"
                  >
                    <UserPlus size={18} color={newMemberName.trim() ? Colors.background : Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.membersList}>
                <View style={styles.memberItem}>
                  <View style={styles.memberAvatarCircle}>
                    <Text style={styles.memberAvatarText}>You</Text>
                  </View>
                  <View style={styles.memberItemInfo}>
                    <Text style={styles.memberItemName}>You (Owner)</Text>
                    <Text style={styles.memberItemRole}>Cycle creator</Text>
                  </View>
                  <View style={styles.ownerBadge}>
                    <Text style={styles.ownerBadgeText}>Owner</Text>
                  </View>
                </View>

                {members.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <View style={[styles.memberAvatarCircle, { backgroundColor: Colors.blueMuted }]}>
                      <Text style={[styles.memberAvatarText, { color: Colors.blue }]}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    {editingMemberId === member.id ? (
                      <View style={styles.editMemberRow}>
                        <TextInput
                          style={styles.editMemberInput}
                          value={editingMemberName}
                          onChangeText={setEditingMemberName}
                          autoFocus
                          onSubmitEditing={saveEditMember}
                          returnKeyType="done"
                        />
                        <TouchableOpacity onPress={saveEditMember} style={styles.editActionBtn}>
                          <Check size={16} color={Colors.green} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelEditMember} style={styles.editActionBtn}>
                          <X size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <View style={styles.memberItemInfo}>
                          <Text style={styles.memberItemName}>{member.name}</Text>
                          {member.email ? (
                            <View style={styles.memberContactRow}>
                              <Mail size={10} color={Colors.textMuted} />
                              <Text style={styles.memberItemEmail}>{member.email}</Text>
                            </View>
                          ) : (
                            <Text style={styles.memberItemRole}>Member</Text>
                          )}
                          {member.phone ? (
                            <View style={styles.memberContactRow}>
                              <Phone size={10} color={Colors.textMuted} />
                              <Text style={styles.memberItemEmail}>{member.phone}</Text>
                            </View>
                          ) : null}
                        </View>
                        {member.email && (
                          <View style={styles.invitePendingBadge}>
                            <Send size={9} color={Colors.warning} />
                            <Text style={styles.invitePendingText}>Invite</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => startEditMember(member)} style={styles.memberActionBtn}>
                          <Edit2 size={14} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeMember(member.id)} style={styles.memberActionBtn}>
                          <UserMinus size={14} color={Colors.danger} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ))}
              </View>

              {members.length > 0 && plan && (
                <View style={styles.splitCard}>
                  <View style={styles.splitHeader}>
                    <Users size={16} color={Colors.green} />
                    <Text style={styles.splitTitle}>Contribution Split</Text>
                  </View>
                  <View style={styles.splitDetails}>
                    <View style={styles.splitRow}>
                      <Text style={styles.splitLabel}>Total per {formatFrequency(frequency)}</Text>
                      <Text style={styles.splitValue}>${plan.contributionAmount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.splitDivider} />
                    <View style={styles.splitRow}>
                      <Text style={styles.splitLabel}>Members</Text>
                      <Text style={styles.splitValue}>{memberCount} people</Text>
                    </View>
                    <View style={styles.splitDivider} />
                    <View style={styles.splitRow}>
                      <Text style={styles.splitLabelHighlight}>Per person</Text>
                      <Text style={styles.splitValueHighlight}>${plan.contributionPerPerson.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              )}

              {members.length === 0 && (
                <View style={styles.emptyMembers}>
                  <Users size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyMembersText}>Add at least one member to continue</Text>
                  <Text style={styles.emptyMembersSubtext}>
                    Use "Invite Member" for full details or quick add by name
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {isReviewStep && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>Your Cycle Plan</Text>
              <Text style={styles.stepSubtitle}>Review your complete savings plan</Text>

              {isTeen && !isTeenApproved && (
                <View style={styles.teenBlockBanner}>
                  <ShieldAlert size={20} color={Colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teenBlockTitle}>Parent Approval Required</Text>
                    <Text style={styles.teenBlockText}>You need parent approval before you can create or join cycles.</Text>
                  </View>
                </View>
              )}

              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Type</Text>
                  <Text style={styles.reviewValue}>
                    {selectedType ? CYCLE_TYPE_INFO[selectedType].label : ''}
                  </Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Name</Text>
                  <Text style={styles.reviewValue}>{name}</Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Goal</Text>
                  <Text style={styles.reviewValue}>${parseFloat(goalAmount || '0').toLocaleString()}</Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Frequency</Text>
                  <Text style={styles.reviewValue}>{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Start Date</Text>
                  <Text style={styles.reviewValue}>{formatEndDate(new Date().toISOString().split('T')[0])}</Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>End Date</Text>
                  <Text style={styles.reviewValue}>{plan ? formatEndDate(plan.estimatedEndDate) : ''}</Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Duration</Text>
                  <Text style={styles.reviewValue}>{DURATION_OPTIONS.find((d) => d.months === duration)?.label}</Text>
                </View>
                {isGroupCycle(selectedType) && (
                  <>
                    <View style={styles.reviewDivider} />
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Members</Text>
                      <Text style={styles.reviewValue}>{memberCount} people</Text>
                    </View>
                  </>
                )}
              </View>

              {plan && (
                <View style={styles.fullPlanCard}>
                  <Text style={styles.fullPlanTitle}>Payment Plan</Text>

                  <View style={styles.planGrid}>
                    <View style={styles.planGridItem}>
                      <View style={[styles.planGridIcon, { backgroundColor: Colors.greenMuted }]}>
                        <DollarSign size={16} color={Colors.green} />
                      </View>
                      <Text style={styles.planGridValue}>
                        ${isGroupCycle(selectedType) ? plan.contributionPerPerson.toFixed(2) : plan.contributionAmount.toFixed(2)}
                      </Text>
                      <Text style={styles.planGridLabel}>
                        {isGroupCycle(selectedType) ? 'Per person' : 'Per ' + formatFrequency(frequency)}
                      </Text>
                    </View>
                    <View style={styles.planGridItem}>
                      <View style={[styles.planGridIcon, { backgroundColor: Colors.blueMuted }]}>
                        <Target size={16} color={Colors.blue} />
                      </View>
                      <Text style={styles.planGridValue}>{plan.totalContributions}</Text>
                      <Text style={styles.planGridLabel}>Contributions</Text>
                    </View>
                    <View style={styles.planGridItem}>
                      <View style={[styles.planGridIcon, { backgroundColor: Colors.orangeMuted }]}>
                        <Calendar size={16} color={Colors.orange} />
                      </View>
                      <Text style={styles.planGridValue}>{formatEndDate(plan.estimatedEndDate).split(',')[0]}</Text>
                      <Text style={styles.planGridLabel}>End Date</Text>
                    </View>
                    <View style={styles.planGridItem}>
                      <View style={[styles.planGridIcon, { backgroundColor: Colors.purpleMuted }]}>
                        {isGroupCycle(selectedType) ? <Users size={16} color={Colors.purple} /> : <Clock size={16} color={Colors.purple} />}
                      </View>
                      <Text style={styles.planGridValue}>
                        {isGroupCycle(selectedType) ? `${memberCount}` : `${duration}mo`}
                      </Text>
                      <Text style={styles.planGridLabel}>
                        {isGroupCycle(selectedType) ? 'Members' : 'Duration'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planSummary}>
                    <Text style={styles.planSummaryText}>
                      {isGroupCycle(selectedType) ? (
                        <>
                          Each of the <Text style={styles.planSummaryHighlight}>{memberCount} members</Text> contributes{' '}
                          <Text style={styles.planSummaryHighlight}>${plan.contributionPerPerson.toFixed(2)}</Text> every{' '}
                          {formatFrequency(frequency)} for{' '}
                          <Text style={styles.planSummaryHighlight}>{duration} month{duration !== 1 ? 's' : ''}</Text> to reach{' '}
                          <Text style={styles.planSummaryHighlight}>${parseFloat(goalAmount || '0').toLocaleString()}</Text>
                        </>
                      ) : (
                        <>
                          Contribute <Text style={styles.planSummaryHighlight}>${plan.contributionAmount.toFixed(2)}</Text> every{' '}
                          {formatFrequency(frequency)} for{' '}
                          <Text style={styles.planSummaryHighlight}>{duration} month{duration !== 1 ? 's' : ''}</Text> to reach your goal of{' '}
                          <Text style={styles.planSummaryHighlight}>${parseFloat(goalAmount || '0').toLocaleString()}</Text>
                        </>
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {isGroupCycle(selectedType) && plan && members.length > 0 && (
                <View style={styles.payoutScheduleCard}>
                  <Text style={styles.payoutScheduleTitle}>Payout Schedule</Text>
                  <Text style={styles.payoutScheduleSubtitle}>Rotation order for payouts</Text>
                  {(() => {
                    const allParticipants = [{ name: user?.name ?? 'You', isOwner: true }, ...members.map(m => ({ name: m.name, isOwner: false }))];
                    const startDate = new Date();
                    return allParticipants.map((p, idx) => {
                      const payoutDate = new Date(startDate);
                      payoutDate.setMonth(payoutDate.getMonth() + idx + 1);
                      const dateStr = payoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return (
                        <View key={idx} style={styles.payoutRow}>
                          <View style={[styles.payoutNumber, idx === 0 && { backgroundColor: Colors.greenMuted }]}>
                            <Text style={[styles.payoutNumberText, idx === 0 && { color: Colors.green }]}>{idx + 1}</Text>
                          </View>
                          <View style={styles.payoutInfo}>
                            <Text style={styles.payoutName}>{p.name}{p.isOwner ? ' (You)' : ''}</Text>
                            <Text style={styles.payoutDate}>{dateStr}</Text>
                          </View>
                          <Text style={styles.payoutAmount}>${plan.goalAmount.toLocaleString()}</Text>
                        </View>
                      );
                    });
                  })()}
                  <View style={styles.payoutTimeline}>
                    <Calendar size={14} color={Colors.textMuted} />
                    <Text style={styles.payoutTimelineText}>
                      {formatEndDate(new Date().toISOString().split('T')[0])} → {plan ? formatEndDate(plan.estimatedEndDate) : ''}
                    </Text>
                  </View>
                </View>
              )}

              {isGroupCycle(selectedType) && members.length > 0 && (
                <View style={styles.membersSummaryCard}>
                  <Text style={styles.membersSummaryTitle}>{getMemberRoleLabel(selectedType)}</Text>
                  {members.map((member) => (
                    <View key={member.id} style={styles.memberSummaryRow}>
                      <View style={[styles.memberSummaryDot, { backgroundColor: CycleTypeColors[selectedType ?? 'individual'] ?? Colors.green }]} />
                      <View style={styles.memberSummaryInfo}>
                        <Text style={styles.memberSummaryName}>{member.name}</Text>
                        {member.email && <Text style={styles.memberSummaryEmail}>{member.email}</Text>}
                      </View>
                      {plan && <Text style={styles.memberSummaryAmount}>${plan.contributionPerPerson.toFixed(2)}/{formatFrequency(frequency)}</Text>}
                    </View>
                  ))}
                  <View style={styles.memberSummaryRow}>
                    <View style={[styles.memberSummaryDot, { backgroundColor: Colors.green }]} />
                    <View style={styles.memberSummaryInfo}>
                      <Text style={styles.memberSummaryName}>You (Owner)</Text>
                    </View>
                    {plan && <Text style={styles.memberSummaryAmount}>${plan.contributionPerPerson.toFixed(2)}/{formatFrequency(frequency)}</Text>}
                  </View>

                  {members.some((m) => m.email) && (
                    <View style={styles.inviteSummaryNote}>
                      <Send size={12} color={Colors.green} />
                      <Text style={styles.inviteSummaryText}>
                        Invites and cycle plan will be sent to {members.filter((m) => m.email).length} member{members.filter((m) => m.email).length !== 1 ? 's' : ''} automatically
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {selectedType === 'teen' && (
                <View style={styles.teenInfo}>
                  <Text style={styles.teenInfoTitle}>Teen Cycle Features</Text>
                  <Text style={styles.teenInfoText}>• Parent/guardian approval for withdrawals</Text>
                  <Text style={styles.teenInfoText}>• Guardian can monitor progress</Text>
                  <Text style={styles.teenInfoText}>• Spending and contribution limits</Text>
                  <Text style={styles.teenInfoText}>• Educational savings tips</Text>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {!isReviewStep ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
              onPress={nextStep}
              disabled={!canProceed()}
              testID="next-step-btn"
            >
              <Text style={[styles.nextBtnText, !canProceed() && styles.nextBtnTextDisabled]}>Continue</Text>
              <ArrowRight size={18} color={canProceed() ? Colors.background : Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} testID="create-cycle-submit">
              <Check size={18} color={Colors.background} />
              <Text style={styles.createBtnText}>Create Cycle</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onAdd={addMemberDetailed}
        cycleType={selectedType ?? 'individual'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
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
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceLight,
  },
  stepDotActive: {
    backgroundColor: Colors.green,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  stepTitle: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  stepSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  typeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    alignItems: 'flex-start',
  },
  typeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  typeLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  typeDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exampleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exampleText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dollarSign: {
    color: Colors.green,
    fontSize: 24,
    fontWeight: '700' as const,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  optionChipActive: {
    backgroundColor: Colors.greenMuted,
    borderColor: Colors.green,
  },
  optionChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  optionChipTextActive: {
    color: Colors.green,
  },
  planPreview: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.green + '33',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  planTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  planHighlight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  planAmount: {
    color: Colors.green,
    fontSize: 28,
    fontWeight: '800' as const,
  },
  planFreq: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginLeft: 6,
  },
  planDetail: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  planDetailMuted: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  inviteDetailedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.green + '44',
    gap: 14,
  },
  inviteDetailedIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteDetailedInfo: {
    flex: 1,
  },
  inviteDetailedTitle: {
    color: Colors.green,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  inviteDetailedDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  quickAddSection: {
    marginBottom: 20,
  },
  quickAddLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  addMemberInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addMemberInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  addMemberBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  membersList: {
    gap: 6,
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  memberAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: Colors.green,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  memberItemRole: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  memberContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberItemEmail: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  invitePendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
  },
  invitePendingText: {
    color: Colors.warning,
    fontSize: 9,
    fontWeight: '700' as const,
  },
  ownerBadge: {
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
  memberActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  editMemberRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editMemberInput: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 10,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.green + '44',
  },
  editActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  splitCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.green + '33',
    marginBottom: 16,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  splitTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  splitDetails: {
    gap: 0,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  splitDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  splitLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  splitValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  splitLabelHighlight: {
    color: Colors.green,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  splitValueHighlight: {
    color: Colors.green,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyMembersText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  emptyMembersSubtext: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reviewLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  reviewValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  fullPlanCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.green + '33',
    marginBottom: 16,
  },
  fullPlanTitle: {
    color: Colors.green,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  planGridItem: {
    width: '47%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  planGridIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  planGridValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  planGridLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500' as const,
  },
  planSummary: {
    backgroundColor: Colors.greenSoft,
    borderRadius: 10,
    padding: 12,
  },
  planSummaryText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  planSummaryHighlight: {
    color: Colors.green,
    fontWeight: '700' as const,
  },
  membersSummaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  membersSummaryTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  memberSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  memberSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberSummaryInfo: {
    flex: 1,
  },
  memberSummaryName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  memberSummaryEmail: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  memberSummaryAmount: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  inviteSummaryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.greenSoft,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  inviteSummaryText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  teenInfo: {
    backgroundColor: Colors.warningMuted,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.warning + '33',
  },
  teenInfoTitle: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  teenInfoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },
  teenBlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.warningMuted,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '33',
  },
  teenBlockTitle: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  teenBlockText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  payoutScheduleCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  payoutScheduleTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  payoutScheduleSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  payoutNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutNumberText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  payoutDate: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  payoutAmount: {
    color: Colors.green,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  payoutTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 10,
  },
  payoutTimelineText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500' as const,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  nextBtnText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  nextBtnTextDisabled: {
    color: Colors.textMuted,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  createBtnText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  purposeHint: {
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
  },
  purposeHintTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  purposeHintText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
