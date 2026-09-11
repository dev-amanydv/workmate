"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "../ui/avatar";
import { LeftSidebar } from "../feed/left-sidebar";
import { RightSidebar, type SuggestedUser } from "../feed/right-sidebar";
import { FeedPostCard } from "../feed/feed-post-card";
import { apiFetch } from "../../lib/api/client";
import type { Post } from "../../types/post";
import type { UserProfile } from "../../types/user";

interface FollowUserItem {
  id: string;
  name: string;
  email?: string;
  bio: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
  isSelf: boolean;
}

interface ProfileViewProps {
  profileUser: UserProfile;
  currentUser: { id: string; name?: string; avatarUrl?: string | null } | null;
  initialPosts?: Post[];
  suggestedUsers?: SuggestedUser[];
}

const AVATAR_PRESETS = [
  { label: "Aman", url: "/mock/avatar-aman.jpg" },
  { label: "Priya", url: "/mock/avatar-priya.jpg" },
  { label: "Rohan", url: "/mock/avatar-rohan.jpg" },
  { label: "Arjun", url: "/mock/avatar-arjun.jpg" },
  { label: "Sneha", url: "/mock/avatar-sneha.jpg" },
  { label: "Neha", url: "/mock/avatar-neha.jpg" },
];

export function ProfileView({
  profileUser,
  currentUser,
  initialPosts = [],
  suggestedUsers = [],
}: ProfileViewProps) {
  const router = useRouter();

  // Core profile state
  const [name, setName] = useState<string>(profileUser.name || "User");
  const [bio, setBio] = useState<string | null>(profileUser.bio ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profileUser.avatarUrl ?? null,
  );
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isFollowing, setIsFollowing] = useState<boolean>(profileUser.isFollowing);
  const [followersCount, setFollowersCount] = useState<number>(
    profileUser.followersCount ?? 0,
  );
  const [followingCount, setFollowingCount] = useState<number>(
    profileUser.followingCount ?? 0,
  );
  const [postsCount, setPostsCount] = useState<number>(
    profileUser.postsCount ?? initialPosts?.length ?? 0,
  );

  // Interaction states
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tabs state: 'posts' | 'followers' | 'following'
  const [activeTab, setActiveTab] = useState<
    "posts" | "followers" | "following"
  >("posts");

  // Followers / Following list data
  const [followersList, setFollowersList] = useState<FollowUserItem[] | null>(null);
  const [followingList, setFollowingList] = useState<FollowUserItem[] | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Edit Profile Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editBio, setEditBio] = useState(bio || "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(avatarUrl || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isSelf =
    profileUser.isSelf ||
    (Boolean(currentUser?.id) && currentUser?.id === profileUser.id);

  // Format joined date
  const joinedDate = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  // User handle: @amanyadav (derived from email prefix or name)
  const userHandle = profileUser.email
    ? (profileUser.email.split("@")[0] ?? "").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
    : name.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "") || "user";

  const userBio = bio || "Building products, exploring ideas, and learning in public.";

  // Sync state if profileUser or initialPosts props change
  useEffect(() => {
    setName(profileUser.name || "User");
    setBio(profileUser.bio ?? null);
    setAvatarUrl(profileUser.avatarUrl ?? null);
    setIsFollowing(profileUser.isFollowing);
    setFollowersCount(profileUser.followersCount ?? 0);
    setFollowingCount(profileUser.followingCount ?? 0);
    setPostsCount(profileUser.postsCount ?? initialPosts?.length ?? 0);
    setPosts(initialPosts);
    setFollowersList(null);
    setFollowingList(null);
  }, [profileUser, initialPosts]);

  // Fetch followers or following when tabs are activated
  useEffect(() => {
    if (activeTab === "followers" && followersList === null) {
      loadFollowers();
    } else if (activeTab === "following" && followingList === null) {
      loadFollowing();
    }
  }, [activeTab]);

  const loadFollowers = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await apiFetch<any>(`/follows/${profileUser.id}/followers`);
      if (Array.isArray(res)) {
        setFollowersList(res);
      } else if (res && Array.isArray(res.data)) {
        setFollowersList(res.data);
      } else {
        setFollowersList([]);
      }
    } catch {
      setListError("Failed to load followers. Please try again.");
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadFollowing = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await apiFetch<any>(`/follows/${profileUser.id}/following`);
      if (Array.isArray(res)) {
        setFollowingList(res);
      } else if (res && Array.isArray(res.data)) {
        setFollowingList(res.data);
      } else {
        setFollowingList([]);
      }
    } catch {
      setListError("Failed to load following. Please try again.");
    } finally {
      setIsLoadingList(false);
    }
  };

  // Follow / Unfollow profile header button
  const handleFollowButtonClick = () => {
    if (isSelf || isTogglingFollow) return;
    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      executeFollow();
    }
  };

  const executeFollow = async () => {
    setIsTogglingFollow(true);
    setIsFollowing(true);
    setFollowersCount((prev) => prev + 1);

    try {
      const res = await apiFetch<{ success: boolean; isFollowing: boolean }>(
        `/follows/${profileUser.id}`,
        { method: "POST" },
      );
      if (res && typeof res.isFollowing === "boolean") {
        setIsFollowing(res.isFollowing);
      }
    } catch {
      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const confirmUnfollow = async () => {
    setShowUnfollowModal(false);
    setIsTogglingFollow(true);

    setIsFollowing(false);
    setFollowersCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await apiFetch<{ success: boolean; isFollowing: boolean }>(
        `/follows/${profileUser.id}`,
        { method: "DELETE" },
      );
      if (res && typeof res.isFollowing === "boolean") {
        setIsFollowing(res.isFollowing);
      }
    } catch {
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  // Follow toggle in followers/following list
  const toggleFollowListItem = async (userItem: FollowUserItem) => {
    const currentlyFollowing = userItem.isFollowing;
    const nextState = !currentlyFollowing;

    const updateList = (list: FollowUserItem[] | null) =>
      list?.map((u) => (u.id === userItem.id ? { ...u, isFollowing: nextState } : u)) ||
      null;

    setFollowersList((prev) => updateList(prev));
    setFollowingList((prev) => updateList(prev));

    if (isSelf) {
      setFollowingCount((prev) =>
        nextState ? prev + 1 : Math.max(0, prev - 1),
      );
    }

    try {
      await apiFetch(`/follows/${userItem.id}`, {
        method: currentlyFollowing ? "DELETE" : "POST",
      });
    } catch {
      // Revert on error
      const revertList = (list: FollowUserItem[] | null) =>
        list?.map((u) =>
          u.id === userItem.id ? { ...u, isFollowing: currentlyFollowing } : u,
        ) || null;
      setFollowersList((prev) => revertList(prev));
      setFollowingList((prev) => revertList(prev));
      if (isSelf) {
        setFollowingCount((prev) =>
          currentlyFollowing ? prev + 1 : Math.max(0, prev - 1),
        );
      }
    }
  };

  // Message Button click: start or continue 1:1 conversation
  const handleMessageClick = async () => {
    if (isStartingChat || !isFollowing) return;
    setIsStartingChat(true);

    try {
      await apiFetch<{ id: string }>("/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ recipientId: profileUser.id }),
      });
      router.push("/chat");
    } catch (err) {
      console.error("Failed to start conversation:", err);
      router.push("/chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPostsCount((prev) => Math.max(0, prev - 1));
  };

  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const openEditModal = () => {
    setEditName(name);
    setEditBio(bio || "");
    setEditAvatarUrl(avatarUrl || "");
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;
    setEditError(null);

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Full name is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await apiFetch<any>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: trimmedName,
          bio: editBio.trim() || null,
          avatarUrl: editAvatarUrl.trim() || null,
        }),
      });

      const updated = res?.data || res;
      if (updated && updated.name) {
        setName(updated.name);
        setBio(updated.bio ?? null);
        setAvatarUrl(updated.avatarUrl ?? null);
      } else {
        setName(trimmedName);
        setBio(editBio.trim() || null);
        setAvatarUrl(editAvatarUrl.trim() || null);
      }
      setShowEditModal(false);
    } catch (err: any) {
      setEditError(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start h-full overflow-hidden">
      {/* Left Navigation Column */}
      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pr-1 shrink-0">
        <LeftSidebar userId={currentUser?.id} />
      </div>

      {/* Center Profile Viewport Column */}
      <div className="h-full overflow-y-auto no-scrollbar py-6 px-1 min-w-0 flex flex-col gap-6">
        {/* Main Profile Showcase Card */}
        <div className="rounded-2xl border border-[#E6E5E0] bg-white overflow-hidden shadow-xs">
          {/* Architectural Textured Banner */}
          <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-[#184A45] via-[#1E5650] to-[#123B37] overflow-hidden">
            {/* Subtle architectural geometric line texture overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="profile-banner-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#FFFFFF" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#profile-banner-grid)" />
              </svg>
            </div>

            {/* Ambient Lighting Gradient */}
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#3FA89B]/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#0E2E2A]/60 blur-xl pointer-events-none" />

            {/* Top-Right Quick Actions: Share / Copy Link */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareProfile}
                className="flex items-center gap-1.5 rounded-lg bg-black/25 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-black/40 hover:text-white border border-white/15 transition cursor-pointer"
                title="Copy profile link"
              >
                {copiedLink ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-[#6ee7b7]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Core Information & Actions Container */}
          <div className="px-5 sm:px-8 pb-6">
            {/* Avatar & Hero Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-5">
              {/* Avatar with Elevation and Self-Edit Indicator */}
              <div className="relative group shrink-0">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-white shadow-md bg-[#EEF4F3] overflow-hidden flex items-center justify-center">
                  <Avatar
                    src={avatarUrl}
                    alt={name}
                    fallbackName={name}
                    size={128}
                    className="h-full w-full object-cover"
                  />
                </div>

                {isSelf && (
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-[#184A45] text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-[#133D39] transition cursor-pointer"
                    title="Change profile avatar"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1 sm:pt-0">
                {isSelf ? (
                  <>
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="flex items-center gap-1.5 rounded-lg border border-[#E6E5E0] bg-[#F5F4F0] px-4 py-2 text-xs font-semibold text-[#17191A] hover:bg-[#EFEFEA] hover:border-[#D8D7D0] transition cursor-pointer shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5 text-[#6C6F71]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                    <Link
                      href="/posts/create"
                      className="flex items-center gap-1.5 rounded-lg bg-[#184A45] px-4.5 py-2 text-xs font-semibold text-white hover:bg-[#133D39] transition shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>New Post</span>
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Follow / Following Button */}
                    <button
                      type="button"
                      onClick={handleFollowButtonClick}
                      disabled={isTogglingFollow}
                      className={`flex items-center gap-1.5 rounded-lg px-4.5 py-2 text-xs font-semibold transition cursor-pointer ${
                        isFollowing
                          ? "border border-[#E6E5E0] bg-[#F5F4F0] text-[#17191A] hover:bg-[#FAF0EE] hover:text-[#9E3B27] hover:border-[#E8C5BE]"
                          : "bg-[#184A45] text-white hover:bg-[#133D39] shadow-xs"
                      }`}
                    >
                      {isTogglingFollow ? (
                        <span>Updating...</span>
                      ) : isFollowing ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-[#184A45]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span>Follow</span>
                        </>
                      )}
                    </button>

                    {/* Direct Message Action */}
                    {isFollowing ? (
                      <button
                        type="button"
                        onClick={handleMessageClick}
                        disabled={isStartingChat}
                        className="flex items-center gap-1.5 rounded-lg border border-[#E6E5E0] bg-[#F5F4F0] px-4 py-2 text-xs font-semibold text-[#184A45] hover:bg-[#EEF4F3] transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        <span>{isStartingChat ? "Opening..." : "Message"}</span>
                      </button>
                    ) : (
                      <div className="relative group">
                        <button
                          type="button"
                          disabled
                          className="flex items-center gap-1.5 rounded-lg border border-[#EDECE8] bg-[#FAF9F7] px-4 py-2 text-xs font-medium text-[#8A8D90] cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                          <span>Message</span>
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap rounded-md bg-[#17191A] px-2 py-1 text-[11px] font-normal text-white shadow-lg pointer-events-none z-20">
                          Follow to unlock direct messaging
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Profile Identity Details: Name, Handle, Bio, Metadata */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17191A]">
                    {name}
                  </h1>
                  
                  {isFollowing && !isSelf && (
                    <span className="inline-flex items-center rounded-md bg-[#F5F4F0] px-2.5 py-0.5 text-[11px] font-medium text-[#484B4D] border border-[#E6E5E0]">
                      Following
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#6C6F71] mt-0.5 font-normal">
                  @{userHandle}
                </p>
              </div>

              {/* Bio description */}
              <p className="text-sm text-[#484B4D] leading-relaxed pt-0.5">
                {userBio}
              </p>

              {/* Identity Metadata Badges: Joined Date & Email */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#6C6F71] pt-1">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#8A8D90]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span>Member since {joinedDate}</span>
                </div>

                {profileUser.email && (
                  <>
                    <span className="text-[#D8D7D0]">|</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#8A8D90]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span>{profileUser.email}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Horizontal Divider Line */}
            <div className="border-t border-[#EDECE8] my-5" />

            {/* User Stats Row: Followers, Following, Posts */}
            <div className="flex items-center gap-10 sm:gap-14 pt-0.5">
              {/* Followers Stat */}
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[#17191A] leading-tight">
                  {followersCount}
                </span>
                <span className="text-xs sm:text-sm text-[#6C6F71] font-normal mt-0.5">
                  Followers
                </span>
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-[#E6E5E0] self-center" />

              {/* Following Stat */}
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[#17191A] leading-tight">
                  {followingCount}
                </span>
                <span className="text-xs sm:text-sm text-[#6C6F71] font-normal mt-0.5">
                  Following
                </span>
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-[#E6E5E0] self-center" />

              {/* Posts Stat */}
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[#17191A] leading-tight">
                  {postsCount}
                </span>
                <span className="text-xs sm:text-sm text-[#6C6F71] font-normal mt-0.5">
                  Posts
                </span>
              </div>
            </div>
          </div>
        </div>



     
      </div>

      {/* Right Column: Suggested Peers & Network Invitations */}
      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pl-1 shrink-0">
        <RightSidebar
          userName={currentUser?.name}
          suggestedUsers={suggestedUsers}
        />
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border border-[#E6E5E0] bg-white p-6 sm:p-7 shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EDECE8]">
              <div>
                <h3 className="text-base font-bold text-[#17191A]">Edit Profile</h3>
                <p className="text-xs text-[#6C6F71]">
                  Update your identity, role, and avatar visible across Workmate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-[#6C6F71] hover:text-[#17191A] rounded transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
              {editError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-[#9E3B27]">
                  {editError}
                </div>
              )}

              

              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-[#17191A] mb-1.5">
                  Full Name <span className="text-[#9E3B27]">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-[#E6E5E0] bg-[#FBFBFA] px-3.5 py-2 text-sm text-[#17191A] placeholder-[#8A8D90] focus:border-[#184A45] focus:outline-hidden transition"
                  placeholder="Your full name"
                  required
                />
              </div>

              {/* Bio Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#17191A]">
                    Headline & Bio
                  </label>
                  <span className="text-[11px] text-[#8A8D90]">
                    {editBio.length}/500
                  </span>
                </div>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-lg border border-[#E6E5E0] bg-[#FBFBFA] p-3 text-sm text-[#17191A] placeholder-[#8A8D90] focus:border-[#184A45] focus:outline-hidden transition resize-none"
                  placeholder="e.g. Distributed Systems Engineer building resilient cloud platforms and high-performance databases."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EDECE8]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-[#E6E5E0] bg-white px-4 py-2 text-xs font-semibold text-[#484B4D] hover:bg-[#F5F4F0] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-lg bg-[#184A45] px-5 py-2 text-xs font-semibold text-white hover:bg-[#133D39] transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Warning Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF0EE] text-[#9E3B27] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
              </svg>
            </div>

            {/* Modal Copy */}
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#17191A]">
                Unfollow {name}?
              </h3>
              <p className="text-xs text-[#6C6F71] leading-relaxed px-2">
                Their posts will no longer appear in your feed, and direct conversations will be paused.
              </p>
            </div>

            {/* Confirmation Actions */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmUnfollow}
                disabled={isTogglingFollow}
                className="w-full rounded-lg bg-[#9E3B27] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#863120] transition cursor-pointer"
              >
                Unfollow
              </button>
              <button
                type="button"
                onClick={() => setShowUnfollowModal(false)}
                className="w-full rounded-lg border border-[#E6E5E0] bg-white py-2.5 text-xs font-semibold text-[#17191A] hover:bg-[#F5F4F0] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
