import React from 'react';
import { View, Text, Animated, ActivityIndicator, Modal, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../hooks/useUserProfile';
import ProfileHeader from '../components/ProfileHeader';
import ProfileStats from '../components/ProfileStats';
import ProfileGrid from '../components/ProfileGrid';
import CameraScreen from './CameraScreen';
import SettingsModal from '../components/SettingsModal';
import BlockedUsersModal from '../components/BlockedUsersModal';
import DiscoverModal from '../components/DiscoverModal';
import UserListModal from '../components/UserListModal';
import CalendarModal from '../components/CalendarModal';
import ImagePopoutModal from '../components/ImagePopoutModal';
import SwipeableModal from '../components/SwipeableModal';
import NotificationListModal from '../components/NotificationListModal';
import { optimizedImageUrl, optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface ProfileScreenProps {
  onHideBottomBar?: (hide: boolean) => void;
}

export default function ProfileScreen({ onHideBottomBar }: ProfileScreenProps = {}) {
  const {
    insets,
    navigation,
    logout,
    username,
    profile,
    myPosts,
    loading,
    isEditingBio,
    setIsEditingBio,
    newBio,
    setNewBio,
    isUploadingPic,
    showSettings,
    setShowSettings,
    showBlockedUsers,
    setShowBlockedUsers,
    blockedUsers,
    loadingBlocked,
    showNotifications,
    setShowNotifications,
    unreadCount,
    showVibeModal,
    setShowVibeModal,
    showDiscoverModal,
    setShowDiscoverModal,
    contacts,
    suggestedFriends,
    loadingDiscover,
    searchQuery,
    setSearchQuery,
    showFollowers,
    setShowFollowers,
    showFollowing,
    setShowFollowing,
    followersList,
    followingList,
    loadingLists,
    showCalendar,
    setShowCalendar,
    calendarSnaps,
    loadingCalendar,
    reactingToPostId,
    setReactingToPostId,
    recordingReel,
    setRecordingReel,
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
    scrollY,
    pulseAnim,
    enterAnim,
    spin,
    streakScale,
    spinInterpolate,
    headerTranslateY,
    profilePicScale,
    fetchProfileData,
    animateStreak,
    handleOpenSettings,
    handleOpenNotifications,
    handleSaveBio,
    handleChangeProfilePic,
    handleDeleteAccount,
    handleOpenBlockedUsers,
    handleUnblockUser,
    handleOpenDiscover,
    handleInviteContact,
    handleFollowUser,
    handleUploadReelChoice,
    handleReactionCapture,
    openFollowers,
    openFollowing,
    openCalendar,
    openComments,
    submitComment,
    handleCommentLongPress
  } = useUserProfile({ onHideBottomBar });

  if (loading) {
    return (
      <View className="flex-1 bg-[#090E17]">
        <Animated.View style={{ opacity: pulseAnim, paddingTop: insets.top + 50 }} className="items-center px-6">
          <View className="w-32 h-32 rounded-full bg-white/10 mb-6" />
          <View className="w-40 h-8 bg-white/10 rounded-full mb-3" />
          <View className="w-64 h-4 bg-white/5 rounded-full mb-10" />
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#090E17]">
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Animated.View style={{ opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
          
          <ProfileHeader
            insets={insets}
            profile={profile}
            isUploadingPic={isUploadingPic}
            isEditingBio={isEditingBio}
            newBio={newBio}
            setNewBio={setNewBio}
            setIsEditingBio={setIsEditingBio}
            handleSaveBio={handleSaveBio}
            handleChangeProfilePic={handleChangeProfilePic}
            handleOpenDiscover={handleOpenDiscover}
            handleOpenNotifications={handleOpenNotifications}
            handleOpenSettings={handleOpenSettings}
            unreadCount={unreadCount}
            spin={spin}
            profilePicScale={profilePicScale}
            headerTranslateY={headerTranslateY}
          />

          <ProfileStats
            followersCount={profile?.followersCount || 0}
            followingCount={profile?.followingCount || 0}
            postsCount={myPosts.length}
            openFollowers={openFollowers}
            openFollowing={openFollowing}
          />

          <ProfileGrid
            profile={profile}
            myPosts={myPosts}
            calendarSnaps={calendarSnaps}
            animateStreak={animateStreak}
            streakScale={streakScale}
            spinInterpolate={spinInterpolate}
            openCalendar={openCalendar}
            handleUploadReelChoice={handleUploadReelChoice}
            setSelectedPost={setSelectedPost}
          />

        </Animated.View>
      </Animated.ScrollView>

      {/* MODALS */}
      <DiscoverModal visible={showDiscoverModal} onClose={() => setShowDiscoverModal(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} loadingDiscover={loadingDiscover} suggestedFriends={suggestedFriends} contacts={contacts} handleFollowUser={handleFollowUser} handleInviteContact={handleInviteContact} />
      
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
      
      <CalendarModal 
        visible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        loading={loadingCalendar} 
        snaps={calendarSnaps} 
        onSnapPress={(url) => setSelectedImage(url)}
      />
      
      {showVibeModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}>
          <BlurView intensity={95} tint="dark" className="flex-1 justify-center relative p-6">
            <View className="absolute inset-0 bg-[#090E17]/80" />
            <TouchableOpacity onPress={() => setShowVibeModal(false)} style={{ top: insets.top + 10 }} className="absolute right-6 z-50 w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-black text-3xl mb-8 text-center tracking-tight">Your Visual Journey</Text>
            <View className="flex-row flex-wrap justify-center gap-4">
              {profile?.calendarSnaps?.map((img: string, i: number) => (
                <View key={i} className="w-[28%] aspect-square rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg shadow-black">
                  {img ? <Image source={{ uri: optimizedImageUrl(img) }} className="w-full h-full" /> : <View className="flex-1 bg-white/5" />}
                </View>
              ))}
            </View>
          </BlurView>
        </View>
      )}

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} onOpenBlockedUsers={handleOpenBlockedUsers} onLogout={logout} onDeleteAccount={handleDeleteAccount} />
      <BlockedUsersModal visible={showBlockedUsers} onClose={() => setShowBlockedUsers(false)} blockedUsers={blockedUsers} loadingBlocked={loadingBlocked} onUnblockUser={handleUnblockUser} />
      
      <NotificationListModal visible={showNotifications} onClose={() => setShowNotifications(false)} />

      {reactingToPostId !== null && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: 'black' }}>
          {reactingToPostId && <CameraScreen mode="reaction" onClose={() => { setReactingToPostId(null); if (onHideBottomBar) onHideBottomBar(false); }} onCapture={handleReactionCapture} />}
        </View>
      )}

      {recordingReel && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: 'black' }}>
          <CameraScreen mode="reel" onClose={() => { setRecordingReel(false); if (onHideBottomBar) onHideBottomBar(false); fetchProfileData(); }} />
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
             if (onHideBottomBar) onHideBottomBar(true);
          }, 300);
        }}
      />

      {/* COMMENTS MODAL */}
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
                <TouchableOpacity activeOpacity={0.8} onLongPress={() => handleCommentLongPress(item)} className="flex-1 bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-sm border border-white/[0.04]">
                  <Text className="text-[#7dd3fc] text-[10px] font-bold mb-1 tracking-wider uppercase">{item?.user?.username || 'Unknown'}</Text>
                  <Text className="text-white/90 text-[13px] leading-5">{item?.text || ''}</Text>
                </TouchableOpacity>
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