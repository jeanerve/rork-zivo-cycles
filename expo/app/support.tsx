import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Bot, Headphones, MessageCircle, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useCycles } from '@/providers/CyclesProvider';
import { Cycle } from '@/types';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  options?: string[];
}

const INITIAL_QUESTIONS = [
  'What type of cycle are you in?',
  'How many days are left in my cycle?',
  'When is my next payout?',
  'How many people are in my cycle?',
  'I need to make a withdrawal',
  'I have a payment or invite issue',
];

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function generateSmartResponse(userMsg: string, cycles: Cycle[], userName: string): string {
  const lower = userMsg.toLowerCase();

  if (lower.includes('days left') || lower.includes('how many days') || lower.includes('when does')) {
    if (cycles.length === 0) {
      return "You don't have any active cycles right now. Create one from the Home screen to get started!";
    }
    const details = cycles.map(c => {
      const days = getDaysLeft(c.endDate);
      return `• **${c.name}** — ${days} days remaining (ends ${new Date(c.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
    }).join('\n');
    return `Here's how much time is left on your cycles:\n\n${details}`;
  }

  if (lower.includes('payout') || lower.includes('when do i get paid') || lower.includes('next payout')) {
    if (cycles.length === 0) {
      return "You don't have any active cycles. Create one to set up a payout schedule!";
    }
    const groupCycles = cycles.filter(c => ['family', 'community'].includes(c.type));
    if (groupCycles.length === 0) {
      return "Your current cycles are individual savings goals — there's no payout rotation. You can withdraw your savings anytime from the cycle detail page.";
    }
    const details = groupCycles.map(c => {
      const memberCount = c.members.length;
      const startDate = new Date(c.startDate);
      const yourIndex = c.members.findIndex(m => m.role === 'owner');
      const payoutDate = new Date(startDate);
      payoutDate.setMonth(payoutDate.getMonth() + yourIndex + 1);
      return `• **${c.name}** — ${memberCount} members, your estimated payout: ${payoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }).join('\n');
    return `Here are your group cycle payouts:\n\n${details}\n\nPayouts depend on the rotation order set when the cycle was created.`;
  }

  if (lower.includes('how many people') || lower.includes('members') || lower.includes('who is in')) {
    if (cycles.length === 0) {
      return "You don't have any cycles yet. Create one and invite members to get started!";
    }
    const details = cycles.map(c => {
      const names = c.members.map(m => m.name).join(', ');
      return `• **${c.name}** (${c.type}) — ${c.members.length} member${c.members.length !== 1 ? 's' : ''}: ${names}`;
    }).join('\n');
    return `Here are the members in your cycles:\n\n${details}`;
  }

  if (lower.includes('type') || lower.includes('what type') || lower.includes('cycle type')) {
    if (cycles.length === 0) {
      return `You don't have any cycles yet. Zivo offers 4 types:\n\n• **Individual** — Personal savings\n• **Family** — Save with family\n• **Community** — Group savings\n• **Teen** — Guided savings with parental controls\n\nWant to create one?`;
    }
    const types = cycles.map(c => `• **${c.name}** — ${c.type.charAt(0).toUpperCase() + c.type.slice(1)} cycle`).join('\n');
    return `Your active cycles:\n\n${types}\n\nYou have ${cycles.length} cycle${cycles.length !== 1 ? 's' : ''} total.`;
  }

  if (lower.includes('progress') || lower.includes('how much') || lower.includes('saved') || lower.includes('total')) {
    if (cycles.length === 0) {
      return "You haven't saved anything yet. Start a cycle to begin tracking your progress!";
    }
    const total = cycles.reduce((sum, c) => sum + c.currentAmount, 0);
    const details = cycles.map(c => {
      const pct = c.goalAmount > 0 ? Math.round((c.currentAmount / c.goalAmount) * 100) : 0;
      return `• **${c.name}** — $${c.currentAmount.toLocaleString()} / $${c.goalAmount.toLocaleString()} (${pct}%)`;
    }).join('\n');
    return `Great question, ${userName}! Here's your savings progress:\n\n${details}\n\n**Total across all cycles: $${total.toLocaleString()}**`;
  }

  if (lower.includes('payment') || lower.includes('pay') || lower.includes('money') || lower.includes('bank') || lower.includes('card')) {
    return "For payment issues:\n\n1. Check your payment method in Profile → Payment Methods\n2. Make sure your bank/card has sufficient funds\n3. Try removing and re-adding your payment method\n\nIf the issue persists, tap 'Contact Live Agent' below.";
  }

  if (lower.includes('invite') || lower.includes('join')) {
    return "For invite issues:\n\n1. Make sure the email address is correct\n2. Ask them to check spam/junk\n3. Resend from cycle detail → tap member → Resend Invite\n\nNeed more help? I can connect you to support.";
  }

  if (lower.includes('withdraw') || lower.includes('emergency')) {
    if (cycles.length === 0) {
      return "You don't have any active cycles to withdraw from. Create a cycle first!";
    }
    const details = cycles.map(c => {
      const isGroup = ['family', 'community'].includes(c.type);
      const isCompleted = c.status === 'completed';
      if (isCompleted) return `• **${c.name}** — Completed (no withdrawal available)`;
      return `• **${c.name}** — ${isGroup ? 'Group cycle: requires member approval' : 'Individual: withdraw anytime'}`;
    }).join('\n');
    return `Here are your withdrawal options:\n\n${details}\n\n**How to withdraw:**\n1. Go to the cycle detail page\n2. Tap the withdrawal button\n3. For group cycles, other members must approve\n4. You can only withdraw what you personally contributed\n\n⚠️ Withdrawals affect your discipline score.\nTeen accounts require parent approval.`;
  }

  if (lower.includes('parent') || lower.includes('teen') || lower.includes('approval') || lower.includes('minor')) {
    return "For teen account issues:\n\n1. Go to Profile → your account shows 'Teen Account'\n2. If approval is pending, ask your parent to check email\n3. Resend from the Parent Approval screen\n\nOnce approved, you'll have full access.";
  }

  if (lower.includes('help') || lower.includes('agent') || lower.includes('human') || lower.includes('live') || lower.includes('support')) {
    return "I'll connect you with a live support agent. Tap 'Contact Live Agent' below.\n\nOur agents are available Monday-Friday, 9am-6pm EST.";
  }

  const cycleCount = cycles.length;
  const totalSaved = cycles.reduce((sum, c) => sum + c.currentAmount, 0);

  return `Hi ${userName}! You have ${cycleCount} active cycle${cycleCount !== 1 ? 's' : ''} with $${totalSaved.toLocaleString()} saved.\n\nI can help with:\n• Your cycle details and progress\n• Payout schedules and timelines\n• Payment and invite issues\n• Withdrawals and account questions\n\nWhat would you like to know?`;
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { cycles } = useCycles();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const firstName = user?.name?.split(' ')[0] ?? 'there';
    const cycleCount = cycles.length;
    const totalSaved = cycles.reduce((sum, c) => sum + c.currentAmount, 0);

    let greeting = `Hi ${firstName}! I'm Zivo's AI assistant.`;
    if (cycleCount > 0) {
      greeting += ` I can see you have ${cycleCount} active cycle${cycleCount !== 1 ? 's' : ''} with $${totalSaved.toLocaleString()} saved.`;
    }
    greeting += '\n\nHere are some things I can help with:';

    const msg: ChatMessage = {
      id: 'welcome',
      role: 'bot',
      text: greeting,
      options: INITIAL_QUESTIONS,
    };
    setMessages([msg]);
  }, [fadeAnim, user?.name, cycles]);

  const addBotResponse = useCallback((userText: string) => {
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    const response = generateSmartResponse(userText, cycles, firstName);
    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'bot',
      text: response,
    };
    setTimeout(() => {
      setMessages(prev => [...prev, botMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 600);
  }, [cycles, user?.name]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    addBotResponse(trimmed);
  }, [input, addBotResponse]);

  const handleOptionPress = useCallback((option: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: option };
    setMessages(prev => [...prev, userMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    addBotResponse(option);
  }, [addBotResponse]);

  const handleLiveAgent = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const subject = encodeURIComponent('Zivo Support Request');
    const body = encodeURIComponent(
      `Hi Zivo Support,\n\nI need help with my account.\n\nAccount: ${user?.email ?? 'N/A'}\nName: ${user?.name ?? 'N/A'}\nActive Cycles: ${cycles.length}\n\nIssue:\n[Please describe your issue here]\n\nThank you.`
    );
    const mailto = `mailto:support@zivo.app?subject=${subject}&body=${body}`;

    Alert.alert(
      'Contact Live Agent',
      'You\'ll be connected to our support team via email. Our agents typically respond within 2-4 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Email',
          onPress: async () => {
            try {
              await Linking.openURL(mailto);
            } catch {
              Alert.alert('Email', 'Please email us at support@zivo.app');
            }
          },
        },
      ]
    );
  }, [user, cycles.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={[styles.botIcon, { backgroundColor: colors.greenMuted }]}>
              <Bot size={18} color={colors.green} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Zivo Support</Text>
              <Text style={[styles.headerStatus, { color: colors.green }]}>AI Assistant • Online</Text>
            </View>
          </View>
          <View style={[styles.backBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
                {msg.role === 'bot' && (
                  <View style={[styles.botAvatar, { backgroundColor: colors.greenMuted }]}>
                    <Bot size={14} color={colors.green} />
                  </View>
                )}
                <View style={[
                  styles.msgBubble,
                  msg.role === 'user'
                    ? { backgroundColor: colors.green + '18', borderWidth: 1, borderColor: colors.green + '33', borderTopRightRadius: 4 }
                    : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderTopLeftRadius: 4 }
                ]}>
                  <Text style={[styles.msgText, { color: msg.role === 'user' ? colors.text : colors.textSecondary }]}>{msg.text}</Text>
                  {msg.options && (
                    <View style={styles.optionsContainer}>
                      {msg.options.map((opt, i) => (
                        <TouchableOpacity key={i} style={[styles.optionBtn, { backgroundColor: colors.surfaceLight }]} onPress={() => handleOptionPress(opt)} activeOpacity={0.7}>
                          <Text style={[styles.optionText, { color: colors.text }]}>{opt}</Text>
                          <ChevronRight size={14} color={colors.green} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.liveAgentBar}>
            <TouchableOpacity style={[styles.liveAgentBtn, { backgroundColor: colors.blueMuted, borderColor: colors.blue + '22' }]} onPress={handleLiveAgent} activeOpacity={0.7}>
              <Headphones size={16} color={colors.blue} />
              <Text style={[styles.liveAgentText, { color: colors.blue }]}>Contact Live Agent</Text>
              <ChevronRight size={14} color={colors.blue} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <MessageCircle size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={input}
                onChangeText={setInput}
                placeholder="Type your question..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                testID="support-input"
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.green : colors.surfaceLight }]}
                onPress={handleSend}
                disabled={!input.trim()}
              >
                <Send size={16} color={input.trim() ? colors.background : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  botIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  headerStatus: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 14,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 21,
  },
  optionsContainer: {
    marginTop: 12,
    gap: 6,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
    marginRight: 8,
  },
  liveAgentBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  liveAgentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
  },
  liveAgentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
