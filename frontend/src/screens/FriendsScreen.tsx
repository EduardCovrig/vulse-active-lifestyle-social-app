import React from 'react';
import { View, Text, TextInput, Animated, TouchableOpacity, Modal, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriendsFeed } from '../hooks/useFriendsFeed';
import FriendsCircleHeader from '../components/FriendsCircleHeader';
import FriendsSearchBox from '../components/FriendsSearchBox';
import FriendsStoryViewer from '../components/FriendsStoryViewer';
import LiquidPostCard from '../components/LiquidPostCard'; 
import CameraScreen from './CameraScreen';
import LockedFeedView from '../components/LockedFeedView';
import ImagePopoutModal from '../components/ImagePopoutModal';

interface FriendsScreenProps {
  onOpenCamera?: () => void;
  onHideBottomBar?: (hide: boolean) => void;
}

export default function FriendsScreen({ onOpenCamera, onHideBottomBar }: FriendsScreenProps) {
  const {
    insets,
    navigation,
    enterAnim,
    posts,
    setPosts,
    circle,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    editingPost,
    setEditingPost,
    editCaptionText,
    setEditCaptionText,
    reactingToPostId,
    setReactingToPostId,
    activeStory,
    storyProgress,
    popoutPost,
    setPopoutPost,
    fetchData,
    onRefresh,
    handleSearch,
    openUserProfile,
    saveCaptionEdit,
    handleLikeToggled,
    handleReactionCapture,
    iHavePosted,
    handleOpenStory,
    closeStory,
  } = useFriendsFeed({ onOpenCamera, onHideBottomBar });

  const renderCircleHeader = () => (
    <FriendsCircleHeader
      circle={circle}
      iHavePosted={iHavePosted}
      onOpenCamera={onOpenCamera}
      handleOpenStory={handleOpenStory}
    />
  );

  return (
    <Animated.View style={{ flex: 1, opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }], backgroundColor: '#090E17' }}>
      
      <FriendsSearchBox
        insets={insets}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        handleSearch={handleSearch}
        openUserProfile={openUserProfile}
      />

      <FlatList
        keyboardShouldPersistTaps="handled"
        data={!iHavePosted ? [] : posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderCircleHeader()}
            {(!loading && circle.length > 0 && !iHavePosted) && <LockedFeedView circle={circle} onOpenCamera={onOpenCamera} />}
          </>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7dd3fc" />}
        ListEmptyComponent={
          (loading || !iHavePosted) ? null : <Text className="text-white/40 text-center mt-20">No posts in your circle today.</Text>
        }
        renderItem={({ item }) => (
          <View className="px-5 mb-4">
            {editingPost === item.id && (
              <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/20 mb-4 px-2 py-1 z-50">
                <TextInput autoFocus className="flex-1 text-white p-3 font-body-md" value={editCaptionText} onChangeText={setEditCaptionText} />
                <TouchableOpacity className="bg-[#7ad7c6]/20 p-2 rounded-full" onPress={() => saveCaptionEdit(item.id)}>
                  <Ionicons name="checkmark" size={20} color="#7ad7c6" />
                </TouchableOpacity>
              </View>
            )}
            
            <LiquidPostCard 
              post={item} 
              onOpenProfile={openUserProfile}
              onPostDeleted={(id) => setPosts(curr => curr.filter(p => p.id !== id))}
              onUserBlocked={(id) => setPosts(curr => curr.filter(p => p.author.id !== id))}
              onLikeToggled={handleLikeToggled}
              onReactRequest={(id) => {
                setReactingToPostId(id);
                if (onHideBottomBar) onHideBottomBar(true);
              }}
              onEditCaption={(id, text) => {
                setEditCaptionText(text);
                setEditingPost(id);
              }}
              onImageLongPress={() => setPopoutPost(item)}
            />
          </View>
        )}
      />

      {/* STORY VIEWER MODAL */}
      <FriendsStoryViewer
        activeStory={activeStory}
        closeStory={closeStory}
        storyProgress={storyProgress}
        insets={insets}
      />

      <Modal visible={reactingToPostId !== null} transparent={true} animationType="fade" onRequestClose={() => { setReactingToPostId(null); if (onHideBottomBar) onHideBottomBar(false); }}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {reactingToPostId && <CameraScreen mode="reaction" onClose={() => { setReactingToPostId(null); if (onHideBottomBar) onHideBottomBar(false); }} onCapture={handleReactionCapture} />}
        </View>
      </Modal>

      {/* UNIFIED VIEWER MODAL */}
      <ImagePopoutModal 
        visible={popoutPost !== null} 
        post={popoutPost} 
        onClose={() => setPopoutPost(null)}
        onReactRequest={(id) => {
          setPopoutPost(null);
          setTimeout(() => {
              setReactingToPostId(id);
              if (onHideBottomBar) onHideBottomBar(true);
          }, 300);
        }}
      />

    </Animated.View>
  );
}