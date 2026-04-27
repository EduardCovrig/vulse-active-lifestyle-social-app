import React from 'react';
import { View, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'; 
import LiquidPostCard from '../components/LiquidPostCard';
import GlassTabBar from '../components/GlassTabBar';

const { height } = Dimensions.get('window');

// Datele mockate
const mockData = [
  {
    id: '1',
    author: { username: 'Marcus_Fit' },
    mediaUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    frontMediaUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80',
    calories: null,
    caption: 'Back on the grind. Niciun pas inapoi! 😤'
  },
  {
    id: '2',
    author: { username: 'Elena_R' },
    mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    frontMediaUrl: null,
    calories: 650,
    caption: 'Post-workout recovery bowl 🥗'
  }
];

export default function FeedScreen() {
  return (
    <View className="flex-1 bg-black">
      {/* Snap to interval / Paging enabled face ca scroll-ul 
        să se oprească fix pe următoarea postare, ca pe TikTok 
      */}
      <FlatList 
        data={mockData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LiquidPostCard post={item} />}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={height * 0.85 + 16} // Înălțimea cardului + margin
        decelerationRate="fast"
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 120 }}
      />

      {/* Floating Glass Bottom Tab Bar (Stilul Bump Perfected) */}
      <View className="absolute bottom-10 inset-x-0 items-center pointer-events-none">
        <BlurView 
          intensity={60} 
          tint="dark" 
          className="pointer-events-auto flex-row justify-around items-center w-[85%] h-20 rounded-[40px] border border-white/15 overflow-hidden shadow-2xl shadow-black"
        >
          {/* Inactiv */}
          <TouchableOpacity className="p-3">
            <Ionicons name="people-outline" size={28} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          {/* Active (Glow Effect) */}
          <TouchableOpacity className="p-3 bg-white/10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Ionicons name="albums" size={30} color="white" />
          </TouchableOpacity>

          {/* Camera (Integrată fin, nu imensă) */}
          <TouchableOpacity className="p-3 bg-primary/20 rounded-full border border-primary/30">
            <Ionicons name="camera" size={30} color="#c5eaff" />
          </TouchableOpacity>

          {/* Inactiv */}
          <TouchableOpacity className="p-3">
            <Ionicons name="person-circle-outline" size={28} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </BlurView>
      </View>
      <GlassTabBar activeTab="friends" />
    </View>
  );
}