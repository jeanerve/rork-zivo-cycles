import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile, updateAvatar } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar ?? '');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        updateAvatar(uri);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Could not open image picker');
    }
  }, [updateAvatar]);

  const handleSave = useCallback(() => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({ name: name.trim(), email: email.trim() });
    router.back();
  }, [name, email, updateProfile, router]);

  const firstName = name.split(' ')[0] || 'U';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.greenMuted }]}>
          <Check size={20} color={colors.green} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                <View style={styles.avatarWrapper}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: colors.green }]} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { borderColor: colors.green, backgroundColor: colors.greenMuted }]}>
                      <Text style={[styles.avatarInitial, { color: colors.green }]}>{firstName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.cameraBtn, { backgroundColor: colors.green, borderColor: colors.background }]}>
                    <Camera size={14} color={colors.background} />
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={[styles.changePhotoText, { color: colors.textMuted }]}>Tap to change photo</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor={colors.textMuted} autoCapitalize="words" testID="edit-name" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} testID="edit-email" />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.green }]} onPress={handleSave} activeOpacity={0.8}>
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Save Changes</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '600' as const },
  saveBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 36, fontWeight: '700' as const },
  cameraBtn: { position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  changePhotoText: { fontSize: 13 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600' as const, marginBottom: 8 },
  input: { borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1 },
  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  saveButtonText: { fontSize: 17, fontWeight: '700' as const },
});
