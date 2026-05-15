import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Sparkles, Flame, Target, TrendingUp, Lightbulb } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useCycles } from '@/providers/CyclesProvider';
import { buildInsights } from '@/utils/aiInsights';
import { AIInsight } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { icon: Flame, label: 'How is my streak?' },
  { icon: Target, label: 'Am I on track?' },
  { icon: TrendingUp, label: 'How can I save more?' },
  { icon: Lightbulb, label: 'Give me a tip' },
];

function InsightPill({ insight, color, bg }: { insight: AIInsight; color: string; bg: string }) {
  return (
    <View style={[styles.insightPill, { backgroundColor: bg, borderColor: color + '20' }]}>
      <Text style={styles.insightEmoji}>{insight.emoji ?? '✨'}</Text>
      <Text style={[styles.insightPillText, { color }]} numberOfLines={3}>{insight.text}</Text>
    </View>
  );
}

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { cycles, totalSaved, activeCycles, completedCycles } = useCycles();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const insights = useMemo(() => {
    if (!user) return [];
    return buildInsights({
      userName: user.name,
      streak: user.streak ?? 0,
      totalSaved,
      disciplineScore: user.disciplineScore ?? 0,
      activeCycles: activeCycles.length,
      completedCycles: completedCycles.length,
      cycles,
      userId: user.id,
    });
  }, [user, totalSaved, activeCycles.length, completedCycles.length, cycles]);

  const buildSystemPrompt = useCallback((): string => {
    if (!user) return '';
    return [
      'You are Zivo AI, a calm, emotionally intelligent financial companion inside the Zivo savings app.',
      'Your tone is supportive, warm, and human — never robotic or corporate. Be brief (2-4 sentences max).',
      'Focus on saving discipline, emotional motivation, building habits, and personal growth.',
      'Avoid trading, crypto, or complex finance jargon. No financial advice disclaimers.',
      `User: ${user.name}.`,
      `Total saved: $${totalSaved.toLocaleString()}.`,
      `Active cycles: ${activeCycles.length}. Completed cycles: ${completedCycles.length}.`,
      `Streak: ${user.streak ?? 0} days. Discipline score: ${user.disciplineScore ?? 0}%.`,
    ].join(' ');
  }, [user, totalSaved, activeCycles.length, completedCycles.length]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...next.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { completion?: string };
      const reply = data.completion?.trim() || "I'm here. Tell me what's on your mind.";
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
    } catch (e) {
      console.log('[AI] Chat error', e);
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble reaching the network right now. But here's a thought: small, consistent saves beat one big push every time.",
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isLoading, buildSystemPrompt]);

  const orbScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const orbOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerOrbWrap}>
            <Animated.View style={[styles.headerOrbGlow, { backgroundColor: colors.green, opacity: orbOpacity, transform: [{ scale: orbScale }] }]} />
            <View style={[styles.headerOrb, { backgroundColor: colors.green }]}>
              <Sparkles size={12} color="#000" />
            </View>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Zivo AI</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <>
            <View style={styles.welcomeBlock}>
              <Text style={[styles.welcomeGreeting, { color: colors.textMuted }]}>Your AI companion</Text>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                Calm. Personal.{'\n'}Built around your money.
              </Text>
              <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>
                I read your saving patterns and give honest, supportive feedback. No judgement, no pressure.
              </Text>
            </View>

            {insights.length > 0 && (
              <View style={styles.insightSection}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Insights for you</Text>
                {insights.slice(0, 4).map(ins => (
                  <InsightPill key={ins.id} insight={ins} color={colors.text} bg={colors.card} />
                ))}
              </View>
            )}

            <View style={styles.insightSection}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Try asking</Text>
              <View style={styles.suggestGrid}>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity
                    key={s.label}
                    style={[styles.suggestChip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => sendMessage(s.label)}
                    activeOpacity={0.8}
                  >
                    <s.icon size={14} color={colors.green} />
                    <Text style={[styles.suggestText, { color: colors.text }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {messages.map(m => (
          <View
            key={m.id}
            style={[
              styles.msgRow,
              m.role === 'user' ? styles.msgRowUser : styles.msgRowAssistant,
            ]}
          >
            <View
              style={[
                styles.msgBubble,
                m.role === 'user'
                  ? { backgroundColor: colors.green }
                  : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.msgText, { color: m.role === 'user' ? '#000' : colors.text }]}>
                {m.content}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.msgRow, styles.msgRowAssistant]}>
            <View style={[styles.msgBubble, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }]}>
              <ActivityIndicator size="small" color={colors.green} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask Zivo anything..."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            editable={!isLoading}
          />
          <TouchableOpacity
            disabled={!input.trim() || isLoading}
            onPress={() => sendMessage(input)}
            style={[styles.sendBtn, { backgroundColor: colors.green, opacity: input.trim() && !isLoading ? 1 : 0.4 }]}
            activeOpacity={0.85}
            testID="ai-send-btn"
          >
            <Send size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerOrbWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOrbGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  headerOrb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  welcomeBlock: {
    marginTop: 8,
    marginBottom: 24,
  },
  welcomeGreeting: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.7,
    lineHeight: 34,
    marginBottom: 10,
  },
  welcomeSub: {
    fontSize: 14,
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  insightSection: {
    marginBottom: 22,
  },
  insightPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  insightEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  insightPillText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  suggestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAssistant: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
  },
  msgText: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  inputBar: {
    borderTopWidth: 0.5,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 24,
    borderWidth: 1,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
