import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Eroare', 'Te rog completează toate câmpurile.');
      return;
    }

    try {
      await register({ username, email, password });
      console.log("Înregistrare cu succes!");
    } catch (error: any) {
      console.log("Eroare register:", error.response?.data || error.message);
      Alert.alert('Înregistrare eșuată', 'Verifică datele introduse.');
    }
  };

  return (
    <View className="flex-1 bg-background relative justify-center items-center px-6">
      
      {/* Orbs pozitionate invers fata de Login */}
      <View className="absolute top-[-10%] right-[-20%] w-72 h-72 bg-tertiary/10 rounded-full" />
      <View className="absolute bottom-[-10%] left-[-20%] w-72 h-72 bg-primary/10 rounded-full" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full max-w-md">
        <View className="mb-8 items-center">
          <Text className="text-4xl font-extrabold text-white tracking-widest uppercase mb-2">Vulse</Text>
          <Text className="text-on-surface-variant text-base tracking-wider">Join the elite.</Text>
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
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="flex-col gap-2 mb-2">
              <Text className="text-secondary text-xs font-bold tracking-widest uppercase ml-1">Password</Text>
              <TextInput
                className="w-full h-14 bg-black/20 rounded-2xl px-5 text-white border border-white/10 focus:border-tertiary/50"
                placeholder="••••••••"
                placeholderTextColor="#bec8ce80"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleRegister} className="mt-2 shadow-lg shadow-tertiary/50">
              <LinearGradient
                colors={['#7dd3fc', '#c5eaff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-14 rounded-2xl items-center justify-center"
              >
                <Text className="text-[#0b1326] text-lg font-bold tracking-wider">CREATE ACCOUNT</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4 gap-2">
              <Text className="text-on-surface-variant">Already elite?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-primary font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}