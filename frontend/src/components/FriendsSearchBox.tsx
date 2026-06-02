import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface FriendsSearchBoxProps {
  insets: any;
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  handleSearch: (text: string) => void;
  openUserProfile: (username: string) => void;
}

export default function FriendsSearchBox({
  insets,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  handleSearch,
  openUserProfile,
}: FriendsSearchBoxProps) {
  return (
    <View className="px-6 mb-2 z-[200]" style={{ paddingTop: insets.top + 10 }}>
      <View className="relative z-[300]">
        <BlurView intensity={40} tint="dark" className="flex-row items-center px-4 h-11 rounded-full border border-white/[0.08] bg-white/[0.03] overflow-hidden">
          <Ionicons name="search" size={18} color="rgba(190,200,206,0.5)" />
          <TextInput 
            placeholder="Search friends..." 
            placeholderTextColor="rgba(190,200,206,0.35)" 
            className="flex-1 ml-3 text-white text-[14px]" 
            keyboardAppearance="dark" 
            value={searchQuery} 
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={18} color="rgba(190,200,206,0.4)" />
            </TouchableOpacity>
          )}
        </BlurView>

        {searchResults.length > 0 && (
          <View style={{ position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: 'rgba(12,16,24,0.97)', borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', paddingVertical: 6, maxHeight: 340, overflow: 'hidden' }}>
            {searchResults.map((u, i) => (
              <TouchableOpacity key={u.id} onPress={() => openUserProfile(u.username)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < searchResults.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' }}>
                    {u.profilePicUrl ? <Image source={{ uri: optimizedThumbUrl(u.profilePicUrl, 100) }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 14 }}>{u.username.charAt(0).toUpperCase()}</Text>}
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, letterSpacing: 0.3 }}>{u.username}</Text>
                    {u.mutualsText && <Text style={{ color: 'rgba(122,215,198,0.7)', fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' }}>{u.mutualsText}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.15)" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
