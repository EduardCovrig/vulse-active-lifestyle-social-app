import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
  Linking,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const theme = useColorScheme();
  const { register } = useContext(AuthContext);

  // Background floating animations
  const blob1Anim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;
  const blob3Anim = useRef(new Animated.Value(0)).current;

  // Step transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(1 / 3)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createLoop(blob1Anim, 14000),
      createLoop(blob2Anim, 18000),
      createLoop(blob3Anim, 22000),
    ]).start();
  }, []);

  // Sweeping larger translations and scaling for active liquid background movement
  const blob1Style = {
    transform: [
      {
        translateX: blob1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 80],
        }),
      },
      {
        translateY: blob1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 110],
        }),
      },
      {
        scale: blob1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1.4],
        }),
      },
    ],
  };

  const blob2Style = {
    transform: [
      {
        translateX: blob2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [90, -70],
        }),
      },
      {
        translateY: blob2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [80, -70],
        }),
      },
      {
        scale: blob2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1.35, 0.85],
        }),
      },
    ],
  };

  const blob3Style = {
    transform: [
      {
        translateX: blob3Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-60, 70],
        }),
      },
      {
        translateY: blob3Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [130, -50],
        }),
      },
      {
        scale: blob3Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.75, 1.2],
        }),
      },
    ],
  };

  // Validations
  const isUsernameValid = username.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 8;

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!isUsernameValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Validation Error', 'Username must be at least 3 characters long.');
        return;
      }
      goToStep(1);
    } else if (currentStep === 1) {
      if (!isEmailValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Validation Error', 'Please enter a valid email address.');
        return;
      }
      goToStep(2);
    }
  };

  const goToStep = (nextStep: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
      Animated.spring(progressWidth, {
        toValue: (nextStep + 1) / 3,
        useNativeDriver: false,
        tension: 45,
        friction: 8,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(15);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleBackStep = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextStep = currentStep - 1;
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 15, duration: 150, useNativeDriver: true }),
        Animated.spring(progressWidth, {
          toValue: (nextStep + 1) / 3,
          useNativeDriver: false,
          tension: 45,
          friction: 8,
        }),
      ]).start(() => {
        setCurrentStep(nextStep);
        slideAnim.setValue(-15);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }
  };

  const handleRegister = async () => {
    if (!isPasswordValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      const data = error.response?.data;
      let errorMessage = 'Something went wrong. Please try again.';

      if (data) {
        if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'object' && !data.error) {
          errorMessage = Object.values(data).join('\n');
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Could not create account', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#05080e] relative justify-center items-center px-6">
      {/* ── Dynamic Liquid Glassy Background ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View
          style={[
            blob1Style,
            {
              position: 'absolute',
              top: '10%',
              left: '-25%',
              width: 350,
              height: 350,
              borderRadius: 175,
              backgroundColor: '#7ad7c6',
              opacity: 0.25,
            },
          ]}
        />
        <Animated.View
          style={[
            blob2Style,
            {
              position: 'absolute',
              bottom: '10%',
              right: '-25%',
              width: 380,
              height: 380,
              borderRadius: 190,
              backgroundColor: '#7dd3fc',
              opacity: 0.20,
            },
          ]}
        />
        <Animated.View
          style={[
            blob3Style,
            {
              position: 'absolute',
              top: '35%',
              right: '5%',
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: '#fdba74',
              opacity: 0.16,
            },
          ]}
        />
        {/* Full-screen high-intensity Blur for deep premium glassy blend */}
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="w-full max-w-md"
        style={{ flex: 1, justifyContent: 'center', width: '100%' }}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          {/* Header navigation bar */}
          <View className="absolute top-20 left-0 right-0 flex-row justify-between items-center z-50 h-12">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (currentStep > 0) {
                  handleBackStep();
                } else {
                  navigation.goBack();
                }
              }}
              className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-black tracking-widest uppercase" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
              Vulse
            </Text>
            <View className="w-10" />
          </View>

          <View className="mb-10 items-center mt-32">
            <Text className="text-white/60 text-base tracking-widest font-extrabold uppercase text-center px-4">
              Join your circle.
            </Text>
            <Text className="text-white/40 text-xs tracking-wider text-center mt-1.5 font-medium px-4">
              Share your moments, track your active logs.
            </Text>
          </View>

          {/* Premium Glassmorphic Card */}
          <BlurView intensity={30} tint="light" className="overflow-hidden rounded-[32px] border border-white/[0.08] p-8 bg-white/[0.01]">
            
            {/* Animated Glowing Progress Line */}
            <View style={{ height: 3, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1.5, overflow: 'hidden', marginBottom: 24 }}>
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: '#7dd3fc',
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  shadowColor: '#7dd3fc',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                }}
              />
            </View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {currentStep === 0 && (
                <View className="flex-col gap-6">
                  <View className="flex-col gap-2">
                    <Text className="text-white/40 text-[10px] font-black tracking-widest uppercase ml-1">Identity</Text>
                    <View className="relative justify-center">
                      <TextInput
                        className="w-full h-14 bg-white/[0.02] rounded-2xl px-5 text-white border border-white/[0.06] focus:border-[#7ad7c6] font-bold text-base"
                        placeholder="username"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={18}
                        keyboardAppearance="dark"
                        value={username}
                        onChangeText={setUsername}
                      />
                      {isUsernameValid && (
                        <View className="absolute right-4">
                          <Ionicons name="checkmark-circle" size={20} color="#7ad7c6" />
                        </View>
                      )}
                    </View>
                    <Text className="text-white/30 text-[9px] ml-1 mt-1 font-bold uppercase tracking-wider">Username must be at least 3 characters.</Text>
                  </View>

                  <TouchableOpacity activeOpacity={0.8} onPress={handleNextStep} className="mt-2">
                    <LinearGradient
                      colors={['#7ad7c6', '#7dd3fc']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#7dd3fc', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 }}
                    >
                      <Text style={{ color: '#090E17', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>Next</Text>
                      <Ionicons name="arrow-forward" size={16} color="#090E17" style={{ marginLeft: 6 }} />
                    </LinearGradient>
                  </TouchableOpacity>

                  <View className="flex-row justify-center mt-4 gap-2">
                    <Text className="text-white/40 font-semibold text-sm">Already a VULSE member?</Text>
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Login'); }}>
                      <Text className="text-[#7dd3fc] font-black text-sm">Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {currentStep === 1 && (
                <View className="flex-col gap-6">
                  <View className="flex-col gap-2">
                    <Text className="text-white/40 text-[10px] font-black tracking-widest uppercase ml-1">Communication</Text>
                    <View className="relative justify-center">
                      <TextInput
                        className="w-full h-14 bg-white/[0.02] rounded-2xl px-5 text-white border border-white/[0.06] focus:border-[#7ad7c6] font-bold text-base"
                        placeholder="you@example.com"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardAppearance="dark"
                        value={email}
                        onChangeText={setEmail}
                      />
                      {isEmailValid && (
                        <View className="absolute right-4">
                          <Ionicons name="checkmark-circle" size={20} color="#7ad7c6" />
                        </View>
                      )}
                    </View>
                    <Text className="text-white/30 text-[9px] ml-1 mt-1 font-bold uppercase tracking-wider">Provide a valid email address.</Text>
                  </View>

                  <TouchableOpacity activeOpacity={0.8} onPress={handleNextStep} className="mt-2">
                    <LinearGradient
                      colors={['#7ad7c6', '#7dd3fc']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#7dd3fc', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 }}
                    >
                      <Text style={{ color: '#090E17', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>Next</Text>
                      <Ionicons name="arrow-forward" size={16} color="#090E17" style={{ marginLeft: 6 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {currentStep === 2 && (
                <View className="flex-col gap-5">
                  <View className="flex-col gap-2">
                    <Text className="text-white/40 text-[10px] font-black tracking-widest uppercase ml-1">Security</Text>
                    <View className="relative justify-center">
                      <TextInput
                        className="w-full h-14 bg-white/[0.02] rounded-2xl px-5 text-white border border-white/[0.06] focus:border-[#7ad7c6] font-bold text-base"
                        placeholder="Min. 8 characters"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardAppearance="dark"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 16 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="rgba(255,255,255,0.4)"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleRegister}
                    disabled={isSubmitting}
                    className="mt-2"
                  >
                    <LinearGradient
                      colors={['#7ad7c6', '#7dd3fc']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#7dd3fc', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 }}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#0b1326" />
                      ) : (
                        <Text style={{ color: '#090E17', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', includeFontPadding: false, textAlignVertical: 'center' }}>
                          Create Account
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* GDPR Links */}
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginTop: 12, paddingHorizontal: 10, lineHeight: 16, fontWeight: '500' }}>
                    By signing up, you agree to our{' '}
                    <Text
                      onPress={() => Linking.openURL('https://vulse-app.com/terms')}
                      style={{ color: '#7dd3fc', fontWeight: '700', textDecorationLine: 'underline' }}
                    >
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text
                      onPress={() => Linking.openURL('https://vulse-app.com/privacy')}
                      style={{ color: '#7dd3fc', fontWeight: '700', textDecorationLine: 'underline' }}
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>
              )}
            </Animated.View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}