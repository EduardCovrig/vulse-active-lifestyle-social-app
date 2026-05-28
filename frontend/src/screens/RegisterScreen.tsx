import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, useColorScheme, ActivityIndicator, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const theme = useColorScheme();
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ username, email, password });
      // AuthContext will set isAuthenticated = true and navigate to Feed
    } catch (error: any) {
      const data = error.response?.data;
      let errorMessage = 'Something went wrong. Please try again.';

      if (data) {
        if (data.message) {
          errorMessage = data.message; // "This email is already registered"
        } else if (typeof data === 'object' && !data.error) {
          errorMessage = Object.values(data).join('\n'); // Errors like "Password must be 8 chars"
        }
      }
      Alert.alert('Could not create account', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background relative justify-center items-center px-6">
      <View className="absolute top-[-10%] right-[-20%] w-72 h-72 bg-tertiary/10 rounded-full" />
      <View className="absolute bottom-[-10%] left-[-20%] w-72 h-72 bg-primary/10 rounded-full" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full max-w-md">
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="mb-8 items-center">
          <Text className="text-4xl font-extrabold text-white tracking-widest uppercase mb-2">Vulse</Text>
          <Text className="text-on-surface-variant text-base tracking-wider">Join your friends on a healthy journey.</Text>
        </View>

        <BlurView intensity={40} tint="dark" className="overflow-hidden rounded-[32px] border border-white/15 p-8">
          <View className="flex-col gap-5">
            <View className="flex-col gap-2">
              <Text className="text-secondary text-xs font-bold tracking-widest uppercase ml-1">Username</Text>
              <TextInput
                className="w-full h-14 bg-black/20 rounded-2xl px-5 text-white border border-white/10 focus:border-tertiary/50"
                placeholder="fit_warrior"
                placeholderTextColor="#bec8ce80"
                autoCapitalize="none"
                keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View className="flex-col gap-2">
              <Text className="text-secondary text-xs font-bold tracking-widest uppercase ml-1">Email</Text>
              <TextInput
                className="w-full h-14 bg-black/20 rounded-2xl px-5 text-white border border-white/10 focus:border-tertiary/50"
                placeholder="you@example.com"
                placeholderTextColor="#bec8ce80"
                keyboardType="email-address"
                autoCapitalize="none"
                keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="flex-col gap-2 mb-2">
              <Text className="text-secondary text-xs font-bold tracking-widest uppercase ml-1">Password</Text>
              <TextInput
                className="w-full h-14 bg-black/20 rounded-2xl px-5 text-white border border-white/10 focus:border-tertiary/50"
                placeholder="Min. 8 characters"
                placeholderTextColor="#bec8ce80"
                keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleRegister} disabled={isSubmitting} className="mt-2 shadow-lg shadow-tertiary/50">
              <LinearGradient
                colors={['#7dd3fc', '#c5eaff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-14 rounded-2xl items-center justify-center flex-row"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#0b1326" />
                ) : (
                  <Text className="text-[#0b1326] text-lg font-bold tracking-wider">CREATE ACCOUNT</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* gdpr compliance terms of services */}
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 8, paddingHorizontal: 10, lineHeight: 16 }}>
              By signing up, you agree to our <Text style={{ color: '#7dd3fc', fontWeight: 'bold' }}>Terms of Service</Text> and acknowledge our <Text style={{ color: '#7dd3fc', fontWeight: 'bold' }}>Privacy Policy</Text>. We do not tolerate abusive content.
            </Text>

            <View className="flex-row justify-center mt-4 gap-2">
              <Text className="text-on-surface-variant">Already a VULSE member?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-primary font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}