import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated, ActivityIndicator, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfileScreen } from '../hooks/useUserProfileScreen';
import UserProfileHeader from '../components/UserProfileHeader';
import ProfileStats from '../components/ProfileStats';
import UserProfileGrid from '../components/UserProfileGrid';
import UserListModal from '../components/UserListModal';
import ImagePopoutModal from '../components/ImagePopoutModal';
import SwipeableModal from '../components/SwipeableModal';
import CameraScreen from './CameraScreen';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

export default function UserProfileScreen() {
  const {
    insets,
    navigation,
    profile,
    userPosts,
    loading,
    isFollowing,
    showFollowers,
    setShowFollowers,
    showFollowing,
    setShowFollowing,
    followersList,
    followingList,
    loadingLists,
    selectedPost,
    setSelectedPost,
    selectedImage,
    setSelectedImage,
    activeCommentsPostId,
    setActiveCommentsPostId,
    comments,
    newComment,
    setNewComment,
    loadingComments,
    reactingToPostId,
    setReactingToPostId,
    scrollY,
    pulseAnim,
    headerTranslateY,
    profilePicScale,
    handleFollowUser,
    openFollowers,
    openFollowing,
    openComments,
    handleLikeToggled,
    submitComment,
    handleReactionCapture,
    isWithinLast24Hours,
  } = useUserProfileScreen();

  if (loading) {
    return (
      <View className="flex-1 bg-[#090E17] items-center justify-center">
        <Animated.View style={{ opacity: pulseAnim }} className="w-24 h-24 rounded-full bg-[#7ad7c6]/20 items-center justify-center">
           <ActivityIndicator color="#7ad7c6" size="large" />
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#090E17]">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + 180 * 0.4, paddingBottom: 100 }}
        className="z-10"
      >
        <UserProfileHeader
          insets={insets}
          navigation={navigation}
          headerTranslateY={headerTranslateY}
          profilePicScale={profilePicScale}
          profile={profile}
          handleFollowUser={handleFollowUser}
          isFollowing={isFollowing}
        />

        <ProfileStats
          followersCount={profile?.followersCount || 0}
          followingCount={profile?.followingCount || 0}
          postsCount={userPosts.length}
          openFollowers={openFollowers}
          openFollowing={openFollowing}
        />

        <UserProfileGrid
          userPosts={userPosts}
          iHavePostedToday={true} // Inside the detail grid we bypass iHavePosted check or handle as required by design
          isWithinLast24Hours={isWithinLast24Hours}
          setSelectedPost={setSelectedPost}
        />

      </Animated.ScrollView>

      <UserListModal 
        visible={showFollowers} 
        onClose={() => setShowFollowers(false)} 
        title="Followers" 
        users={followersList} 
        loading={loadingLists} 
        onUserTap={(u) => { setShowFollowers(false); navigation.navigate('UserProfile', { username: u }); }}
      />
      <UserListModal 
        visible={showFollowing} 
        onClose={() => setShowFollowing(false)} 
        title="Following" 
        users={followingList} 
        loading={loadingLists} 
        onUserTap={(u) => { setShowFollowing(false); navigation.navigate('UserProfile', { username: u }); }}
      />

      {reactingToPostId !== null && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: 'black' }}>
          {reactingToPostId && <CameraScreen mode="reaction" onClose={() => { setReactingToPostId(null); }} onCapture={handleReactionCapture} />}
        </View>
      )}

      <ImagePopoutModal 
        visible={selectedPost !== null || selectedImage !== null} 
        post={selectedPost} 
        imageUri={selectedImage}
        onClose={() => {
           setSelectedPost(null);
           setSelectedImage(null);
        }} 
        onOpenComments={(id) => {
          setSelectedPost(null);
          setTimeout(() => openComments(id), 300);
        }}
        onReactRequest={(id) => {
          setSelectedPost(null);
          setTimeout(() => {
             setReactingToPostId(id);
          }, 300);
        }}
      />

      <SwipeableModal 
        visible={activeCommentsPostId !== null} 
        onClose={() => setActiveCommentsPostId(null)}
        title="Comments"
        heightRatio={0.65}
      >
        {loadingComments ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
            renderItem={({ item }) => (
              <View className="flex-row gap-3 mb-4">
                <View className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.04]">
                  {item?.user?.profilePicUrl ? (
                    <Image source={{ uri: optimizedThumbUrl(item.user.profilePicUrl, 100) }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white/60 text-xs font-semibold">{item?.user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
                  )}
                </View>
                <View className="flex-1 bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-sm border border-white/[0.04]">
                  <Text className="text-[#7dd3fc] text-[10px] font-bold mb-1 tracking-wider uppercase">{item?.user?.username || 'Unknown'}</Text>
                  <Text className="text-white/90 text-[13px] leading-5">{item?.text || ''}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text className="text-white/20 text-center mt-10 text-xs">No comments yet.</Text>}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.04)', backgroundColor: 'rgba(9,14,23,0.95)' }}>
          <TextInput value={newComment} onChangeText={setNewComment} placeholder="Add a comment..." placeholderTextColor="rgba(255,255,255,0.2)" keyboardAppearance="dark" style={{ flex: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, paddingHorizontal: 16, color: 'white', fontSize: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
          <TouchableOpacity onPress={submitComment} disabled={!newComment.trim()} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: newComment.trim() ? '#7dd3fc' : 'rgba(255,255,255,0.04)' }}>
            <Ionicons name="arrow-up" size={20} color={newComment.trim() ? '#090E17' : 'rgba(255,255,255,0.15)'} />
          </TouchableOpacity>
        </View>
      </SwipeableModal>

    </View>
  );
}