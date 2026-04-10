import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { FeedPost, FeedComment } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

const FEED_STORAGE_KEY = 'zivo_feed_posts';

export const [FeedProvider, useFeed] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);

  const feedQuery = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      console.log('[Feed] Loading feed posts...');
      const stored = await AsyncStorage.getItem(FEED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FeedPost[];
        console.log('[Feed] Found', parsed.length, 'posts');
        return parsed;
      }
      return [];
    },
  });

  useEffect(() => {
    if (feedQuery.data) setPosts(feedQuery.data);
  }, [feedQuery.data]);

  const syncPosts = useMutation({
    mutationFn: async (updated: FeedPost[]) => {
      await AsyncStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(updated));
      console.log('[Feed] Synced', updated.length, 'posts');
      return updated;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const createPost = useCallback((params: {
    cycleId: string;
    cycleName: string;
    title: string;
    description: string;
    amountSaved: number;
    imageUrl?: string;
  }) => {
    if (!user) return null;

    const newPost: FeedPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      cycleId: params.cycleId,
      cycleName: params.cycleName,
      title: params.title,
      description: params.description,
      amountSaved: params.amountSaved,
      imageUrl: params.imageUrl,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    syncPosts.mutate(updated);
    console.log('[Feed] Created post:', newPost.title);
    return newPost;
  }, [user, posts, syncPosts]);

  const likePost = useCallback((postId: string) => {
    if (!user) return;
    const updated = posts.map(p => {
      if (p.id !== postId) return p;
      const alreadyLiked = p.likes.includes(user.id);
      return {
        ...p,
        likes: alreadyLiked
          ? p.likes.filter(id => id !== user.id)
          : [...p.likes, user.id],
      };
    });
    setPosts(updated);
    syncPosts.mutate(updated);
  }, [user, posts, syncPosts]);

  const addComment = useCallback((postId: string, text: string) => {
    if (!user || !text.trim()) return;
    const comment: FeedComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = posts.map(p => {
      if (p.id !== postId) return p;
      return { ...p, comments: [...p.comments, comment] };
    });
    setPosts(updated);
    syncPosts.mutate(updated);
  }, [user, posts, syncPosts]);

  const getPostForCycle = useCallback((cycleId: string) => {
    return posts.find(p => p.cycleId === cycleId) ?? null;
  }, [posts]);

  return useMemo(() => ({
    posts,
    createPost,
    likePost,
    addComment,
    getPostForCycle,
    isLoading: feedQuery.isLoading,
  }), [posts, createPost, likePost, addComment, getPostForCycle, feedQuery.isLoading]);
});
