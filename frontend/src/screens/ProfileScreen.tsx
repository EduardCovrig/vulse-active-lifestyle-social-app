import React, { useContext } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { username, logout } = useContext(AuthContext);

  // Mock data pentru calendar
  const mockDays = [
    { day: 'Mon', active: true, img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&q=80' },
    { day: 'Tue', active: true, img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&q=80' },
    { day: 'Wed', active: true, img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&q=80' },
    { day: 'Today', active: true, img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=200&q=80', isToday: true },
    { day: 'Fri', active: false },
  ];

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 150, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. HEADER (TopBar) */}
      <View className="flex-row justify-between items-center mb-8">
        <TouchableOpacity className="w-10 h-10 rounded-full bg-white/5 border border-white/20 items-center justify-center">
          <Ionicons name="menu" size={24} color="#D2E3FB" />
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-white/5 border border-white/20 items-center justify-center">
          <Ionicons name="ellipsis-vertical" size={24} color="#D2E3FB" />
        </TouchableOpacity>
      </View>

      {/* 2. PROFILE INFO */}
      <View className="items-center justify-center mb-10">
        <View className="w-32 h-32 rounded-full border border-white/20 p-1 bg-white/5 shadow-[0_0_30px_rgba(210,227,251,0.15)] mb-4">
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }} 
            className="w-full h-full rounded-full"
          />
        </View>
        <Text className="text-3xl font-extrabold text-primary tracking-tight">
          {username || 'Elena Rostova'}
        </Text>
        <Text className="text-on-surface-variant text-base mt-1">Explorer & Wellness Enthusiast</Text>
      </View>

      {/* 3. BENTO GRID: LIFESTYLE */}
      <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-2">Your Lifestyle</Text>
      <View className="flex-row justify-between mb-8">
        
        {/* Streak Card */}
        <BlurView intensity={40} tint="dark" className="w-[48%] rounded-3xl border border-white/15 p-5 overflow-hidden">
          <View className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[30px]" />
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="flame" size={20} color="#7ad7c6" />
            <Text className="text-primary text-xs font-bold">Current Streak</Text>
          </View>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-white text-5xl font-black">14</Text>
            <Text className="text-on-surface-variant font-bold">days</Text>
          </View>
        </BlurView>

        {/* Macros Card */}
        <BlurView intensity={40} tint="dark" className="w-[48%] rounded-3xl border border-white/15 p-5">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="pie-chart" size={20} color="#7dd3fc" />
            <Text className="text-secondary text-xs font-bold">Today's Macros</Text>
          </View>
          <View className="flex-col gap-3">
            <View className="w-full h-2 bg-surface rounded-full overflow-hidden">
              <View className="h-full bg-primary w-[75%]" />
            </View>
            <View className="w-full h-2 bg-surface rounded-full overflow-hidden">
              <View className="h-full bg-secondary w-[45%]" />
            </View>
            <View className="w-full h-2 bg-surface rounded-full overflow-hidden">
              <View className="h-full bg-tertiary w-[85%]" />
            </View>
          </View>
        </BlurView>
      </View>

      {/* 4. VISUAL CALENDAR */}
      <View className="flex-row justify-between items-center mb-3 ml-2 mr-2">
        <Text className="text-secondary text-xs font-bold tracking-widest uppercase">Visual Calendar</Text>
        <TouchableOpacity><Text className="text-primary text-xs font-bold">View All</Text></TouchableOpacity>
      </View>
      
      <BlurView intensity={40} tint="dark" className="rounded-3xl border border-white/15 p-4 mb-8">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {mockDays.map((item, index) => (
            <View 
              key={index} 
              className={`w-20 h-28 rounded-2xl overflow-hidden border ${item.isToday ? 'border-primary shadow-[0_0_15px_rgba(197,234,255,0.3)]' : 'border-white/10'} ${!item.active ? 'bg-white/5 items-center justify-center' : ''}`}
            >
              {item.active ? (
                <>
                  <Image source={{ uri: item.img }} className="w-full h-full object-cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute bottom-0 inset-x-0 p-2 items-center">
                    <Text className={`text-[10px] font-bold ${item.isToday ? 'text-primary' : 'text-white'}`}>{item.day}</Text>
                  </LinearGradient>
                </>
              ) : (
                <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.2)" />
              )}
            </View>
          ))}
        </ScrollView>
      </BlurView>

      {/* 5. SETTINGS & LOGOUT */}
      <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-2">Settings</Text>
      <BlurView intensity={40} tint="dark" className="rounded-3xl border border-white/15 overflow-hidden">
        
        <TouchableOpacity className="flex-row justify-between items-center p-5 border-b border-white/10">
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
              <Ionicons name="person" size={20} color="white" />
            </View>
            <Text className="text-white font-bold text-base">Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row justify-between items-center p-5 border-b border-white/10">
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
              <Ionicons name="notifications" size={20} color="white" />
            </View>
            <Text className="text-white font-bold text-base">Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* LOGOUT BUTTON - Asta e pe bune! */}
        <TouchableOpacity onPress={logout} className="flex-row justify-between items-center p-5">
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center border border-red-500/30">
              <Ionicons name="log-out" size={20} color="#ff4b4b" />
            </View>
            <Text className="text-[#ff4b4b] font-bold text-base">Sign Out</Text>
          </View>
        </TouchableOpacity>

      </BlurView>

    </ScrollView>
  );
}