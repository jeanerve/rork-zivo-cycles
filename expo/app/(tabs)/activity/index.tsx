import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bell, DollarSign, Clock, Award, Users, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useCycles } from '@/providers/CyclesProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Notification } from '@/types';

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'contribution': return DollarSign;
    case 'reminder': return Clock;
    case 'milestone': return Award;
    case 'withdrawal': return AlertTriangle;
    case 'member': return Users;
    default: return Bell;
  }
}

function getNotificationColor(type: Notification['type'], colors: ReturnType<typeof useTheme>['colors']) {
  switch (type) {
    case 'contribution': return colors.green;
    case 'reminder': return colors.blue;
    case 'milestone': return colors.warning;
    case 'withdrawal': return colors.danger;
    case 'member': return colors.purple;
    default: return colors.textSecondary;
  }
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, markNotificationRead, cycles } = useCycles();
  const { user } = useAuth();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const committedUsers = useMemo(() => {
    const seen = new Set<string>();
    const members: { id: string; name: string; avatar: string }[] = [];
    const currentUserId = user?.id ?? '';
    for (const cycle of cycles) {
      for (const m of cycle.members) {
        if (!seen.has(m.id) && m.id !== currentUserId) {
          seen.add(m.id);
          members.push({ id: m.id, name: m.name, avatar: m.avatar });
        }
      }
    }
    return members;
  }, [cycles, user?.id]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    markNotificationRead(notification.id);
    if (notification.cycleId) {
      router.push(`/cycle/${notification.cycleId}`);
    }
  }, [markNotificationRead, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Activity</Text>
          <View style={styles.headerRight}>
            <Bell size={20} color={colors.textSecondary} />
          </View>
        </View>

        {committedUsers.length > 0 && (
          <View style={styles.committedSection}>
            <Text style={[styles.committedLabel, { color: colors.textMuted }]}>COMMITTED WITH</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.committedScroll}
            >
              {committedUsers.map((member) => (
                <View key={member.id} style={styles.committedUser}>
                  <View style={[styles.committedAvatarRing, { borderColor: colors.green }]}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.committedAvatar} />
                    ) : (
                      <View style={[styles.committedAvatarPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                        <Text style={[styles.committedAvatarText, { color: colors.textSecondary }]}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.committedName, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {member.name.split(' ')[0]}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {notifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            const iconColor = getNotificationColor(notification.type, colors);

            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  { backgroundColor: colors.card, borderColor: !notification.read ? colors.green + '33' : colors.cardBorder },
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '1A' }]}>
                  <IconComponent size={18} color={iconColor} />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>{notification.title}</Text>
                    <Text style={[styles.notificationTime, { color: colors.textMuted }]}>{formatTimeAgo(notification.date)}</Text>
                  </View>
                  <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>{notification.message}</Text>
                </View>
                {!notification.read && <View style={[styles.unreadDot, { backgroundColor: colors.green }]} />}
              </TouchableOpacity>
            );
          })}

          {notifications.length === 0 && (
            <View style={styles.emptyState}>
              <Bell size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No activity yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Contributions and updates will appear here</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800' as const },
  headerRight: { padding: 8 },
  committedSection: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  committedLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  committedScroll: {
    gap: 16,
    paddingRight: 20,
  },
  committedUser: {
    alignItems: 'center',
    width: 60,
  },
  committedAvatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    padding: 2,
    marginBottom: 6,
  },
  committedAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  committedAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  committedAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  committedName: {
    fontSize: 11,
    textAlign: 'center',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notificationTitle: { fontSize: 14, fontWeight: '600' as const, flex: 1, marginRight: 8 },
  notificationTime: { fontSize: 11 },
  notificationMessage: { fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 17, fontWeight: '600' as const, marginTop: 8 },
  emptySubtext: { fontSize: 13 },
});
