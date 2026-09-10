import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { handleError } from '../utils/errorHandler';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { username, logout } = useContext(AuthContext);

  // States for Profile Form
  const [profileUsername, setProfileUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // States for Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Fetch current user details on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoadingProfile(true);
      try {
        const response = await api.get('/users/me');
        setProfileUsername(response.data.username || '');
        setEmail(response.data.email || '');
      } catch (error) {
        handleError(error, 'Failed to load account details');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchUserDetails();
  }, []);

  const handleUpdateProfile = async () => {
    if (!profileUsername.trim() || profileUsername.trim().length < 3) {
      Alert.alert('Validation Error', 'Username must be at least 3 characters long');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setSavingProfile(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.put('/users/me/profile', {
        username: profileUsername.trim(),
        email: email.trim()
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      handleError(error, 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setSavingPassword(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.put('/users/me/password', {
        oldPassword,
        newPassword
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password updated successfully!');
    } catch (error: any) {
      handleError(error, 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#090E17' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-[#090E17]" style={{ paddingTop: insets.top }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-[#090E17]">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-black tracking-tight">Account Settings</Text>
            <View className="w-10" />
          </View>

          {loadingProfile ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#7ad7c6" />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile Details Card */}
              <View className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 mt-6 relative overflow-hidden">
                <LinearGradient
                  colors={['rgba(122, 215, 198, 0.03)', 'transparent']}
                  className="absolute inset-0"
                />
                <Text className="text-white font-extrabold text-base mb-5">Profile Information</Text>

                <View className="mb-4">
                  <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Username</Text>
                  <TextInput
                    value={profileUsername}
                    onChangeText={setProfileUsername}
                    placeholder="Username"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white font-medium"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    className="h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white font-medium"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  disabled={savingProfile}
                  className="overflow-hidden rounded-xl"
                >
                  <LinearGradient
                    colors={['#7ad7c6', '#7dd3fc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {savingProfile ? (
                      <ActivityIndicator color="#0b1326" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#0b1326" />
                        <Text style={{ color: '#0b1326', fontWeight: '900', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', includeFontPadding: false, textAlignVertical: 'center' }}>
                          Save Profile
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Password Form Card */}
              <View className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 mt-6 relative overflow-hidden">
                <LinearGradient
                  colors={['rgba(253, 186, 116, 0.02)', 'transparent']}
                  className="absolute inset-0"
                />
                <Text className="text-white font-extrabold text-base mb-5">Change Password</Text>

                <View className="mb-4">
                  <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Current Password</Text>
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white font-medium"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">New Password</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white font-medium"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Confirm New Password</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white font-medium"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleUpdatePassword}
                  disabled={savingPassword}
                  className="overflow-hidden rounded-xl"
                >
                  <LinearGradient
                    colors={['#fdba74', '#f87171']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {savingPassword ? (
                      <ActivityIndicator color="#0b1326" />
                    ) : (
                      <>
                        <Ionicons name="key" size={18} color="#0b1326" />
                        <Text style={{ color: '#0b1326', fontWeight: '900', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', includeFontPadding: false, textAlignVertical: 'center' }}>
                          Update Password
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
