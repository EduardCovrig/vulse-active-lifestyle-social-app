import React from 'react';
import { View, Text, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import BouncyPressable from './BouncyPressable';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface FriendsCircleHeaderProps {
  circle: any[];
  iHavePosted: boolean;
  onOpenCamera?: () => void;
  handleOpenStory: (friend: any) => void;
}

export default function FriendsCircleHeader({
  circle,
  iHavePosted,
  onOpenCamera,
  handleOpenStory,
}: FriendsCircleHeaderProps) {
  return (
    <View className="mb-4 mt-2">
      <Text className="text-[#7ad7c6]/70 text-[9px] font-black tracking-[2px] uppercase mb-4 px-6">Daily Circle</Text>
      <FlatList 
        horizontal
        data={circle}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
        renderItem={({ item }) => (
          <BouncyPressable 
            className="items-center" 
            scaleTo={0.92} 
            onPress={() => {
              if (item.isMe && !item.hasPosted && !iHavePosted) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (onOpenCamera) onOpenCamera();
              } else {
                handleOpenStory(item);
              }
            }}
          >
            <View className="relative w-[50px] h-[50px] rounded-full items-center justify-center mb-1.5" style={{ borderRadius: 25 }}>
              {item.hasPosted ? (
                <LinearGradient colors={['rgba(122,215,198,0.6)', 'rgba(125,211,252,0.6)']} className="absolute inset-0 rounded-full" style={{ padding: 1.5, borderRadius: 25 }}>
                  <View className="w-full h-full bg-[#090E17] rounded-full border-[1.5px] border-[#090E17] overflow-hidden items-center justify-center" style={{ borderRadius: 23 }}>
                    {item.img || item.profilePicUrl ? (
                      <Image source={{ uri: optimizedThumbUrl(item.img || item.profilePicUrl, 100) }} style={{ width: '100%', height: '100%', borderRadius: 23 }} resizeMode="cover" blurRadius={(!item.isMe && !iHavePosted) ? 10 : 0} />
                    ) : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderRadius: 23 }}>
                        <Text className="text-white/80 font-bold text-xs">{item.name?.charAt(0)?.toUpperCase()}</Text>
                      </View>
                    )}
                    {(!item.isMe && !iHavePosted) && (
                      <View className="absolute inset-0 bg-black/40 items-center justify-center" style={{ borderRadius: 23 }}>
                        <Ionicons name="lock-closed" size={16} color="white" />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              ) : (
                <View className="absolute inset-0 rounded-full border-[0.5px] border-white/10 p-[1.5px]" style={{ borderRadius: 25 }}>
                  <View className="w-full h-full rounded-full overflow-hidden opacity-30 bg-white/5 items-center justify-center" style={{ borderRadius: 23 }}>
                    {item.img || item.profilePicUrl ? (
                      <Image source={{ uri: optimizedThumbUrl(item.img || item.profilePicUrl, 100) }} style={{ width: '100%', height: '100%', borderRadius: 23 }} resizeMode="cover" />
                    ) : (
                      <Text className="text-white/40 font-bold text-xs">{item.name?.charAt(0)?.toUpperCase()}</Text>
                    )}
                  </View>
                </View>
              )}
              {item.isMe && !item.hasPosted && !iHavePosted && (
                <View className="absolute bottom-0 right-0 bg-[#7dd3fc] w-5 h-5 rounded-full items-center justify-center border-2 border-[#090E17]">
                  <Ionicons name="add" size={12} color="#090E17" />
                </View>
              )}
            </View>
            <Text className={`text-[9px] font-semibold text-center w-14 ${item.hasPosted ? 'text-white/80' : 'text-white/30'}`} numberOfLines={1}>{item.name}</Text>
          </BouncyPressable>
        )}
      />
      {iHavePosted && <Text className="text-white/30 text-[9px] font-semibold tracking-[3px] uppercase mb-3 px-6 mt-5">Latest Updates</Text>}
    </View>
  );
}
