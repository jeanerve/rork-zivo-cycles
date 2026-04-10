import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Send, Sparkles, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '@/providers/ThemeProvider';

interface AchievementPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; imageUrl?: string }) => void;
  cycleName: string;
  goalAmount: number;
}

export default function AchievementPostModal({ visible, onClose, onSubmit, cycleName, goalAmount }: AchievementPostModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
      setTitle('');
      setDescription('');
      setImageUri(undefined);
    }
  }, [visible, fadeAnim, slideAnim]);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('[AchievementPost] Image picker error:', error);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({ title: title.trim(), description: description.trim(), imageUrl: imageUri });
  }, [title, description, imageUri, onSubmit]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.sparkleWrap, { backgroundColor: colors.greenMuted }]}>
                  <Sparkles size={18} color={colors.green} />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Share Your Achievement</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Tell the world what you achieved</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.cycleInfo, { backgroundColor: colors.greenMuted, borderColor: colors.green + '22' }]}>
              <Text style={[styles.cycleInfoText, { color: colors.green }]}>
                {cycleName} — ${goalAmount.toLocaleString()} saved
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>What did you achieve?</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Bought my first car"
                placeholderTextColor={colors.textMuted}
                testID="achievement-title-input"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Your story</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Share your journey and what this means to you..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                testID="achievement-desc-input"
              />

              <TouchableOpacity
                style={[styles.imagePickerBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePickerContent}>
                    <Camera size={24} color={colors.textMuted} />
                    <Text style={[styles.imagePickerText, { color: colors.textMuted }]}>Add a photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.skipBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.green, opacity: title.trim() ? 1 : 0.5 }]}
                onPress={handleSubmit}
                disabled={!title.trim()}
                activeOpacity={0.85}
                testID="share-achievement-btn"
              >
                <Send size={16} color="#000" />
                <Text style={styles.submitBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sparkleWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleInfo: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  cycleInfoText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
  },
  imagePickerBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePickerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  imagePickerText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  previewImage: {
    width: '100%',
    height: 180,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingBottom: 20,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000',
  },
});
