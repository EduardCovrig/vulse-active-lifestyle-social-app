import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, useColorScheme} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const theme = useColorScheme();
  
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    //validare inainte de trimitere request
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      await login({ email, password });
      console.log("Logare cu succes!");
    } catch (error: any) {
      console.log("Eroare login:", error.response?.data || error.message);
      Alert.alert('Login Failed', 'Your email or password is incorrect.');
    }
  };

  return (
    <View className="flex-1 bg-background relative justify-center items-center px-6">
      
      {/* Decorative Glowing Orbs in Background */}
      <View className="absolute top-[-10%] left-[-20%] w-72 h-72 bg-primary/10 rounded-full" />
      <View className="absolute bottom-[-10%] right-[-20%] w-72 h-72 bg-secondary/10 rounded-full" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="w-full max-w-md"
      >
        <View className="mb-10 items-center">
          <Text className="text-4xl font-extrabold text-white tracking-widest uppercase mb-2">
            Vulse
          </Text>
          <Text className="text-on-surface-variant text-base tracking-wider">
            Enter your healthy era.
          </Text>
        </View>

        <BlurView 
          intensity={40} 
          tint="dark" 
          className="overflow-hidden rounded-[32px] border border-white/15 p-8"
        >
          <View className="flex-col gap-6">
            
            <View className="flex-col gap-2">
              <Text className="text-secondary text-xs font-bold tracking-widest uppercase ml-1">Email</Text>
              <TextInput
                className="w-full h-14 bg-black/20 rounded-2xl px-5 text-white border border-white/10 focus:border-secondary/50"
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
                className="w-full h-14 bg-black/20 rounded-2xl px-5 text-white border border-white/10 focus:border-secondary/50"
                placeholder="••••••••"
                placeholderTextColor="#bec8ce80"
                keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleLogin}
              className="mt-4 shadow-lg shadow-secondary/50"
            >
              <LinearGradient
                colors={['#7ad7c6', '#7dd3fc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-14 rounded-2xl items-center justify-center"
              >
                <Text className="text-[#0b1326] text-xl font-bold tracking-wider">
                  LOG IN
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4 gap-2">
              <Text className="text-on-surface-variant">New here?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-primary font-bold">Join VULSE</Text>
              </TouchableOpacity>
            </View>

          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}