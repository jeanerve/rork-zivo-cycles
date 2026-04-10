import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Heart, MessageCircle, Sparkles, TrendingUp, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useFeed } from '@/providers/FeedProvider';
import { useAuth } from '@/providers/AuthProvider';
import { FeedPost } from '@/types';

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PostCard({ post, onLike, onComment, userId, colors }: {
  post: FeedPost;
  onLike: (id: string) => void;
  onComment: (id: string, text: string) => void;
  userId: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const isLiked = post.likes.includes(userId);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
    ]).start();
    onLike(post.id);
  }, [post.id, onLike, heartScale]);

  const handleSubmitComment = useCallback(() => {
    if (!commentText.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComment(post.id, commentText);
    setCommentText('');
  }, [post.id, commentText, onComment]);

  return (
    <View style={[postStyles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={postStyles.header}>
        {post.userAvatar ? (
          <Image source={{ uri: post.userAvatar }} style={[postStyles.avatar, { borderColor: colors.green }]} />
        ) : (
          <View style={[postStyles.avatarPlaceholder, { backgroundColor: colors.surfaceLight, borderColor: colors.green }]}>
            <Text style={[postStyles.avatarText, { color: colors.textSecondary }]}>
              {post.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={postStyles.headerInfo}>
          <Text style={[postStyles.userName, { color: colors.text }]}>{post.userName}</Text>
          <Text style={[postStyles.timeAgo, { color: colors.textMuted }]}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
        <View style={[postStyles.savedBadge, { backgroundColor: colors.greenMuted }]}>
          <TrendingUp size={12} color={colors.green} />
          <Text style={[postStyles.savedAmount, { color: colors.green }]}>${post.amountSaved.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={[postStyles.title, { color: colors.text }]}>{post.title}</Text>
      {post.description ? (
        <Text style={[postStyles.description, { color: colors.textSecondary }]}>{post.description}</Text>
      ) : null}

      <View style={[postStyles.cycleBadge, { backgroundColor: colors.surfaceLight }]}>
        <Sparkles size={12} color={colors.green} />
        <Text style={[postStyles.cycleName, { color: colors.textMuted }]}>{post.cycleName}</Text>
      </View>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={postStyles.postImage} contentFit="cover" />
      ) : null}

      <View style={postStyles.actions}>
        <TouchableOpacity style={postStyles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Heart
              size={20}
              color={isLiked ? '#EF4444' : colors.textMuted}
              fill={isLiked ? '#EF4444' : 'none'}
            />
          </Animated.View>
          <Text style={[postStyles.actionText, { color: isLiked ? '#EF4444' : colors.textMuted }]}>
            {post.likes.length > 0 ? post.likes.length : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={postStyles.actionBtn}
          onPress={() => setShowComments(!showComments)}
          activeOpacity={0.7}
        >
          <MessageCircle size={20} color={colors.textMuted} />
          <Text style={[postStyles.actionText, { color: colors.textMuted }]}>
            {post.comments.length > 0 ? post.comments.length : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={postStyles.commentsSection}>
          {post.comments.map(comment => (
            <View key={comment.id} style={[postStyles.commentRow, { borderTopColor: colors.border }]}>
              <Text style={[postStyles.commentUser, { color: colors.text }]}>{comment.userName}</Text>
              <Text style={[postStyles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>
            </View>
          ))}
          <View style={postStyles.commentInputRow}>
            <TextInput
              style={[postStyles.commentInput, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add encouragement..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleSubmitComment}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[postStyles.commentSendBtn, { backgroundColor: colors.green, opacity: commentText.trim() ? 1 : 0.4 }]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim()}
            >
              <Send size={14} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const postStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  timeAgo: {
    fontSize: 12,
    marginTop: 1,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  savedAmount: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  cycleName: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  commentsSection: {
    marginTop: 12,
  },
  commentRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { posts, likePost, addComment } = useFeed();
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const sortedPosts = useMemo(() =>
    [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Zivo Feed</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Achievements from the community</Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: colors.greenMuted }]}>
            <Sparkles size={16} color={colors.green} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
          }
        >
          {sortedPosts.length === 0 && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.greenMuted }]}>
                <Sparkles size={40} color={colors.green} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No achievements yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                Complete a savings cycle and share what you achieved with the community
              </Text>
              <View style={[styles.emptyTipCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.emptyTipTitle, { color: colors.textSecondary }]}>How it works</Text>
                <View style={styles.emptyTipRow}>
                  <View style={[styles.emptyTipDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.emptyTipText, { color: colors.textMuted }]}>Create a cycle with a savings goal</Text>
                </View>
                <View style={styles.emptyTipRow}>
                  <View style={[styles.emptyTipDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.emptyTipText, { color: colors.textMuted }]}>Save consistently and build discipline</Text>
                </View>
                <View style={styles.emptyTipRow}>
                  <View style={[styles.emptyTipDot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.emptyTipText, { color: colors.textMuted }]}>Complete the cycle and share your achievement</Text>
                </View>
              </View>
            </View>
          )}

          {sortedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={likePost}
              onComment={addComment}
              userId={user?.id ?? ''}
              colors={colors}
            />
          ))}
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
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800' as const },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emptyTipCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  emptyTipTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  emptyTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyTipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyTipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
});
