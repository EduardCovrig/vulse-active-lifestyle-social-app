import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Alert, Animated, Dimensions, Share } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { handleError } from '../utils/errorHandler';

const HEADER_HEIGHT = 180;
const { width } = Dimensions.get('window');

interface UseUserProfileProps {
  onHideBottomBar?: (hide: boolean) => void;
}

export function useUserProfile({ onHideBottomBar }: UseUserProfileProps = {}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { logout, username } = useContext(AuthContext);

  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showVibeModal, setShowVibeModal] = useState(false);

  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarSnaps, setCalendarSnaps] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [reactingToPostId, setReactingToPostId] = useState<string | null>(null);
  const [recordingReel, setRecordingReel] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Streak Animation Refs
  const streakScale = useRef(new Animated.Value(1)).current;
  const streakRotate = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_HEIGHT],
    outputRange: [-50, 0, HEADER_HEIGHT * 0.5],
    extrapolate: 'clamp',
  });

  const profilePicScale = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const spinInterpolate = streakRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg']
  });

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true })
      ])
    ).start();

    try {
      const [profileRes, postsRes, notifRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/posts/my-posts').catch(() => ({ data: [] })),
        api.get('/notifications').catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setNewBio(profileRes.data.bio || '');
      setMyPosts(postsRes.data);
      
      const unread = notifRes.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);

      if (profileRes.data.username) {
        api.get(`/users/${profileRes.data.username}/calendar`)
          .then(res => setCalendarSnaps(res.data))
          .catch(() => {});
      }
    } catch (error) {
      handleError(error, 'Could not fetch your profile. Loaded fallback data.');
      setProfile({ username: username || "Explorer", bio: "Welcome to Vulse", followersCount: 0, followingCount: 0 });
    } finally {
      setLoading(false);
      Animated.spring(enterAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    }
  }, [pulseAnim, enterAnim, username]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const animateStreak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(streakScale, { toValue: 1.2, useNativeDriver: true }),
        Animated.timing(streakRotate, { toValue: 1, duration: 40, useNativeDriver: true })
      ]),
      Animated.timing(streakRotate, { toValue: -1, duration: 40, useNativeDriver: true }),
      Animated.timing(streakRotate, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(streakRotate, { toValue: 0, duration: 40, useNativeDriver: true }),
      Animated.spring(streakScale, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      spinAnim.setValue(0);
      setShowSettings(true);
    });
  };

  const handleOpenNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNotifications(true);
    setUnreadCount(0); // Reset UI optimistic
  };

  const handleSaveBio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.put(`/users/me?bio=${encodeURIComponent(newBio)}`);
      setProfile((prev: any) => prev ? { ...prev, bio: newBio } : { bio: newBio });
      setIsEditingBio(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      handleError(error, 'Failed to save bio');
    }
  };

  const handleChangeProfilePic = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsUploadingPic(true);
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'profile.jpg';
        const type = `image/${filename.split('.').pop()}`;

        formData.append('file', { uri, name: filename, type } as any);

        const response = await api.patch('/users/me/picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        setProfile((prev: any) => prev ? { ...prev, profilePicUrl: response.data.profilePicUrl } : { profilePicUrl: response.data.profilePicUrl });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error: any) {
        handleError(error, 'Failed to upload profile picture');
      } finally {
        setIsUploadingPic(false);
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Warning", "Deleting your account is irreversible. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete('/users/me');
            logout();
          } catch (error) {
            handleError(error, 'Failed to delete account');
          }
      }}
    ]);
  };

  const handleOpenBlockedUsers = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettings(false); 
    setTimeout(() => {
      setShowBlockedUsers(true);
      setLoadingBlocked(true);
      api.get('/safety/blocked')
        .then(res => setBlockedUsers(res.data))
        .catch((err) => handleError(err, 'Failed to fetch blocked users'))
        .finally(() => setLoadingBlocked(false));
    }, 400); 
  };

  const handleUnblockUser = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/safety/block/${userId}`);
      setBlockedUsers(curr => curr.filter(u => u.id !== userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      handleError(error, 'Failed to unblock user');
    }
  };

  const handleOpenDiscover = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDiscoverModal(true);
    setLoadingDiscover(true);
    try {
      const suggRes = await api.get('/users/suggestions');
      setSuggestedFriends(suggRes.data);

      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
        if (data.length > 0) {
          const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0).slice(0, 30);
          setContacts(validContacts);
        }
      }
    } catch (e) {
      handleError(e, 'Failed to load friend suggestions or contacts');
    } finally {
      setLoadingDiscover(false);
    }
  };

  const handleInviteContact = async (contact: any) => {
    try {
      await Share.share({
        message: `Hey ${contact.name}! Join me on Vulse. Let's start our healthy era together! 🚀\nhttps://vulse.app`,
      });
    } catch (error) {
      handleError(error, 'Failed to share invite link');
    }
  };

  const handleFollowUser = async (userId: string) => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
     try {
       await api.post(`/users/${userId}/follow`);
       setSuggestedFriends(curr => curr.filter(u => u.id !== userId));
       // Optimistically update followings count if viewing own profile
       setProfile((prev: any) => prev ? { ...prev, followingCount: prev.followingCount + 1 } : prev);
     } catch (e) {
       handleError(e, 'Failed to follow user');
     }
  };

  const uploadVideoDirectly = async (uri: string) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'upload.mp4';
      const type = `video/${filename.split('.').pop()}`;
      formData.append('file', { uri, name: filename, type } as any);
      formData.append('type', 'REEL');
      formData.append('caption', 'New post on Vulse! ⚡');

      await api.post('/posts/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchProfileData(); 
    } catch(e) {
      handleError(e, 'Failed to upload video');
    }
  };

  const handleUploadReelChoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Upload Video",
      "Choose a method to upload your reel",
      [
        { text: "Record Video", onPress: () => {
            setRecordingReel(true);
            if (onHideBottomBar) onHideBottomBar(true);
        }},
        { text: "Upload from Library", onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0].uri) {
               uploadVideoDirectly(result.assets[0].uri);
            }
        }},
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleReactionCapture = async (uri: string, message?: string) => {
    if (!reactingToPostId) return;
    const postId = reactingToPostId;
    setReactingToPostId(null);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'reaction.jpg';
      const type = `image/${filename.split('.').pop()}`;
      formData.append('file', { uri, name: filename, type } as any);
      if (message) {
         formData.append('message', message);
      }

      setMyPosts(curr => curr.map(p => p.id === postId ? { ...p, recentReactions: [uri, ...(p.recentReactions || [])].slice(0, 3) } : p));

      await api.post(`/interactions/${postId}/react`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (selectedPost && selectedPost.id === postId) {
         setSelectedPost((prev: any) => ({ ...prev, recentReactions: [uri, ...(prev.recentReactions || [])].slice(0, 3) }));
      }
    } catch (error) {
      handleError(error, 'Failed to send reaction');
    }
  };

  const openFollowers = async () => {
    if (!profile) return;
    setShowFollowers(true); setLoadingLists(true);
    try {
      const res = await api.get(`/users/${profile.username}/followers`);
      setFollowersList(res.data);
    } catch(e) {
      handleError(e, 'Failed to fetch followers');
    } finally {
      setLoadingLists(false);
    }
  };

  const openFollowing = async () => {
    if (!profile) return;
    setShowFollowing(true); setLoadingLists(true);
    try {
      const res = await api.get(`/users/${profile.username}/following`);
      setFollowingList(res.data);
    } catch(e) {
      handleError(e, 'Failed to fetch following');
    } finally {
      setLoadingLists(false);
    }
  };

  const openCalendar = async () => {
    if (!profile) return;
    setShowCalendar(true); setLoadingCalendar(true);
    try {
      const res = await api.get(`/users/${profile.username}/calendar`);
      setCalendarSnaps(res.data);
    } catch(e) {
      handleError(e, 'Failed to fetch calendar snaps');
    } finally {
      setLoadingCalendar(false);
    }
  };

  const openComments = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const response = await api.get(`/comments/${postId}?page=0&size=50`);
      setComments(response.data.content);
    } catch (error) {
      handleError(error, 'Failed to fetch comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activeCommentsPostId) return;
    const text = newComment;
    setNewComment('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/comments/${activeCommentsPostId}`, { text });
      const response = await api.get(`/comments/${activeCommentsPostId}?page=0&size=50`);
      setComments(response.data.content);
      
      if (selectedPost && selectedPost.id === activeCommentsPostId) {
        setSelectedPost({ ...selectedPost, commentsCount: (selectedPost.commentsCount || 0) + 1 });
      }
      setMyPosts(curr => curr.map(p => p.id === activeCommentsPostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    } catch (error) {
      handleError(error, 'Failed to submit comment');
    }
  };

  const handleLikeToggled = (postId: string, newIsLiked: boolean) => {
    setMyPosts(curr => curr.map(p => p.id === postId ? { ...p, isLiked: newIsLiked, likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => ({ ...prev, isLiked: newIsLiked, likesCount: newIsLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1) }));
    }
  };

  const handleCommentLongPress = (comment: any) => {
    if (comment.user.username !== username) return; 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Comment", "Do you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/comments/${comment.id}`);
          setComments(curr => curr.filter(c => c.id !== comment.id));
          if (selectedPost && selectedPost.id === activeCommentsPostId) {
            setSelectedPost({ ...selectedPost, commentsCount: Math.max(0, (selectedPost.commentsCount || 0) - 1) });
          }
          setMyPosts(curr => curr.map(p => p.id === activeCommentsPostId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
        } catch (e) {
          handleError(e, 'Failed to delete comment');
        }
      }}
    ]);
  };

  return {
    insets,
    navigation,
    logout,
    username,
    profile,
    setProfile,
    myPosts,
    setMyPosts,
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
    setUnreadCount,
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
    setComments,
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
    handleLikeToggled,
    handleCommentLongPress
  };
}
