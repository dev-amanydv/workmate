"use client";

import { useEffect, useState } from "react";
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
  initialPosts: Post[];
  suggestedUsers?: SuggestedUser[];
}

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
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isFollowing, setIsFollowing] = useState<boolean>(profileUser.isFollowing);
  const [followersCount, setFollowersCount] = useState<number>(
    profileUser.followersCount ?? 0,
  );
  const [followingCount, setFollowingCount] = useState<number>(
    profileUser.followingCount ?? 0,
  );

  // Interaction states
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tabs state: 'posts' | 'followers' | 'following'
  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following">("posts");

  // Followers / Following list data
  const [followersList, setFollowersList] = useState<FollowUserItem[] | null>(null);
  const [followingList, setFollowingList] = useState<FollowUserItem[] | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Edit Profile Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editBio, setEditBio] = useState(bio || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isSelf =
    profileUser.isSelf || (Boolean(currentUser?.id) && currentUser?.id === profileUser.id);
  const userInitial = name.charAt(0).toUpperCase();

  // Format joined date
  const joinedDate = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  // Derive display headline / role
  const displayRole =
    bio && bio.length > 0 && !bio.includes("\n") && bio.length < 60
      ? bio
      : "Workmate Member";

  // Sync state if profileUser or initialPosts props change
  useEffect(() => {
    setName(profileUser.name || "User");
    setBio(profileUser.bio ?? null);
    setIsFollowing(profileUser.isFollowing);
    setFollowersCount(profileUser.followersCount ?? 0);
    setFollowingCount(profileUser.followingCount ?? 0);
    setPosts(initialPosts);
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
      const res = await apiFetch<FollowUserItem[]>(
        `/follows/${profileUser.id}/followers`,
      );
      if (Array.isArray(res)) {
        setFollowersList(res);
      } else if (res && Array.isArray((res as any).data)) {
        setFollowersList((res as any).data);
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
      const res = await apiFetch<FollowUserItem[]>(
        `/follows/${profileUser.id}/following`,
      );
      if (Array.isArray(res)) {
        setFollowingList(res);
      } else if (res && Array.isArray((res as any).data)) {
        setFollowingList((res as any).data);
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
  };

  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;
    setEditError(null);

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await apiFetch<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: trimmedName,
          bio: editBio.trim() || null,
        }),
      });

      if (res && res.name) {
        setName(res.name);
        setBio(res.bio ?? null);
      } else {
        setName(trimmedName);
        setBio(editBio.trim() || null);
      }
      setShowEditModal(false);
    } catch {
      setEditError("Failed to save profile changes. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 h-full min-h-0 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <div className="hidden lg:block h-full min-h-0 overflow-y-auto no-scrollbar py-6 pr-1 shrink-0">
        <LeftSidebar userId={currentUser?.id} />
      </div>

      {/* Main Profile Center Column: Scrolls independently without viewport clipping */}
      <div className="h-full min-h-0 overflow-y-auto py-6 px-1 min-w-0 flex flex-col gap-6 pb-24">
        {/* Profile Card */}
        <div className="overflow-hidden rounded-xl border border-[#E6E5E0] bg-white shadow-xs">
          {/* Cover Header Banner: Refined Deep Mineral Pine with architectural watermark */}
          <div className="relative h-44 sm:h-52 w-full bg-gradient-to-br from-[#184A45] via-[#143E3A] to-[#0E2C29] overflow-hidden">
            {/* Subtle architectural structural grid lines watermark */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:28px_28px]" />
            {/* Ambient warm radial lighting */}
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute left-1/4 -bottom-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

            {/* Share Profile Action Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={handleShareProfile}
                className="flex items-center gap-1.5 rounded-lg bg-white/15 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition cursor-pointer shadow-2xs"
                title="Share profile link"
              >
                {copiedLink ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Copied!</span>
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

          {/* Profile Header Body */}
          <div className="relative px-6 pb-6 pt-0 sm:px-8">
            {/* Avatar Row with overlapping layout & Action Buttons */}
            <div className="flex flex-wrap items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-5">
              {/* Profile Avatar */}
              <Avatar
                src={profileUser.avatarUrl}
                alt={name}
                fallbackName={name}
                size={128}
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-xl border-4 border-white shadow-md shrink-0"
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {isSelf ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(name);
                        setEditBio(bio || "");
                        setEditError(null);
                        setShowEditModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-[#E6E5E0] bg-[#F5F4F0] px-3.5 py-2 text-xs font-semibold text-[#17191A] hover:bg-[#EFEFEA] transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-[#6C6F71]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                    <Link
                      href="/posts/create"
                      className="flex items-center gap-1.5 rounded-lg bg-[#184A45] px-4 py-2 text-xs font-semibold text-white hover:bg-[#133D39] transition shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>New Dispatch</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    {/* Follow / Following Toggle Button */}
                    <button
                      type="button"
                      onClick={handleFollowButtonClick}
                      disabled={isTogglingFollow}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                        isFollowing
                          ? "border border-[#E6E5E0] bg-[#F5F4F0] text-[#17191A] hover:bg-[#EFEFEA]"
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

                    {/* Direct Message Button */}
                    {isFollowing && (
                      <button
                        type="button"
                        onClick={handleMessageClick}
                        disabled={isStartingChat}
                        className="flex items-center gap-1.5 rounded-lg border border-[#E6E5E0] bg-[#F5F4F0] px-3.5 py-2 text-xs font-semibold text-[#184A45] hover:bg-[#EEF4F3] transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        <span>{isStartingChat ? "Opening..." : "Message"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Identity Details: Name, Headline, Bio, Metadata */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17191A]">
                    {name}
                  </h1>
                  {isSelf && (
                    <span className="rounded-md bg-[#EEF4F3] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase text-[#184A45] border border-[#184A45]/15">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[#484B4D] mt-0.5">
                  {displayRole}
                </p>
              </div>

              {/* Bio Block */}
              {bio ? (
                <div className="text-sm text-[#484B4D] leading-relaxed max-w-2xl bg-[#FBFBFA] border-l-2 border-[#184A45] pl-3 py-1 rounded-r-md">
                  <p className="whitespace-pre-line">{bio}</p>
                </div>
              ) : (
                <p className="text-sm italic text-[#8A8D90]">
                  No professional bio provided yet.
                </p>
              )}

              {/* Metadata Row: Joined Date, Email Contact */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#6C6F71] pt-1">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#8A8D90]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span>Joined {joinedDate}</span>
                </div>

                {profileUser.email && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#8A8D90]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span>{profileUser.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prominent High-Level Stats Showcase Bar */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#EDECE8] pt-5">
              {/* Stat 1: Dispatches / Posts */}
              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  activeTab === "posts"
                    ? "border-[#184A45] bg-[#EEF4F3]/60 ring-1 ring-[#184A45]/30"
                    : "border-[#E6E5E0] bg-[#F5F4F0] hover:bg-[#EFEFEA]"
                }`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-[#17191A]">
                    {posts.length}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#484B4D] mt-0.5">
                  {posts.length === 1 ? "Post" : "Posts"}
                </p>
                <span className="text-[11px] text-[#8A8D90] hidden sm:block">
                  Authored updates
                </span>
              </button>

              {/* Stat 2: Followers */}
              <button
                type="button"
                onClick={() => setActiveTab("followers")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  activeTab === "followers"
                    ? "border-[#184A45] bg-[#EEF4F3]/60 ring-1 ring-[#184A45]/30"
                    : "border-[#E6E5E0] bg-[#F5F4F0] hover:bg-[#EFEFEA]"
                }`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-[#17191A]">
                    {followersCount}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#484B4D] mt-0.5">
                  {followersCount === 1 ? "Follower" : "Followers"}
                </p>
                <span className="text-[11px] text-[#8A8D90] hidden sm:block">
                  Colleagues following
                </span>
              </button>

              {/* Stat 3: Following */}
              <button
                type="button"
                onClick={() => setActiveTab("following")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  activeTab === "following"
                    ? "border-[#184A45] bg-[#EEF4F3]/60 ring-1 ring-[#184A45]/30"
                    : "border-[#E6E5E0] bg-[#F5F4F0] hover:bg-[#EFEFEA]"
                }`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-[#17191A]">
                    {followingCount}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#484B4D] mt-0.5">
                  Following
                </p>
                <span className="text-[11px] text-[#8A8D90] hidden sm:block">
                  Peers followed
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#EDECE8] pb-1 px-1">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 pb-2.5 text-sm font-semibold transition relative cursor-pointer ${
              activeTab === "posts"
                ? "text-[#184A45] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#184A45]"
                : "text-[#6C6F71] hover:text-[#17191A]"
            }`}
          >
            <span>Posts</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === "posts"
                  ? "bg-[#EEF4F3] text-[#184A45]"
                  : "bg-[#F5F4F0] text-[#6C6F71]"
              }`}
            >
              {posts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("followers")}
            className={`flex items-center gap-2 pb-2.5 text-sm font-semibold transition relative cursor-pointer ${
              activeTab === "followers"
                ? "text-[#184A45] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#184A45]"
                : "text-[#6C6F71] hover:text-[#17191A]"
            }`}
          >
            <span>Followers</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === "followers"
                  ? "bg-[#EEF4F3] text-[#184A45]"
                  : "bg-[#F5F4F0] text-[#6C6F71]"
              }`}
            >
              {followersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("following")}
            className={`flex items-center gap-2 pb-2.5 text-sm font-semibold transition relative cursor-pointer ${
              activeTab === "following"
                ? "text-[#184A45] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#184A45]"
                : "text-[#6C6F71] hover:text-[#17191A]"
            }`}
          >
            <span>Following</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === "following"
                  ? "bg-[#EEF4F3] text-[#184A45]"
                  : "bg-[#F5F4F0] text-[#6C6F71]"
              }`}
            >
              {followingCount}
            </span>
          </button>
        </div>

        {/* Tab 1: Posts Feed */}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-5">
            {posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E6E5E0] bg-white p-12 text-center shadow-2xs">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4F3] text-[#184A45]">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-[#17191A]">No posts yet</h3>
                <p className="mt-1 text-xs text-[#6C6F71] max-w-sm mx-auto">
                  {isSelf
                    ? "You haven't posted any updates yet. Share your thoughts or ideas with the network!"
                    : `${name} has not shared any posts yet.`}
                </p>
                {isSelf && (
                  <div className="mt-4">
                    <Link
                      href="/posts/create"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#184A45] px-4 py-2 text-xs font-semibold text-white hover:bg-[#133D39] transition shadow-2xs"
                    >
                      <span>Create first post</span>
                      <span className="text-sm leading-none">→</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Followers List */}
        {activeTab === "followers" && (
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-[#17191A] mb-4">
              Colleagues following {name}
            </h2>

            {isLoadingList ? (
              <div className="py-12 text-center text-xs text-[#6C6F71]">
                Loading followers...
              </div>
            ) : listError ? (
              <div className="py-8 text-center text-xs text-[#9E3B27]">
                {listError}
              </div>
            ) : !followersList || followersList.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-[#17191A]">No followers yet</p>
                <p className="text-xs text-[#6C6F71] mt-1">
                  When colleagues follow {name}, they will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDECE8]">
                {followersList.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/profile/${userItem.id}`}
                      className="flex items-center gap-3 min-w-0 group"
                    >
                      <Avatar
                        src={userItem.avatarUrl}
                        alt={userItem.name}
                        fallbackName={userItem.name}
                        size={40}
                        className="h-10 w-10 rounded-md border border-[#E6E5E0] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#17191A] group-hover:text-[#184A45] transition truncate">
                          {userItem.name}
                        </h4>
                        <p className="text-xs text-[#6C6F71] truncate">
                          {userItem.bio || "Workmate Member"}
                        </p>
                      </div>
                    </Link>

                    <div>
                      {userItem.isSelf ? (
                        <span className="rounded-md bg-[#F5F4F0] border border-[#E6E5E0] px-3 py-1.5 text-xs font-medium text-[#6C6F71]">
                          You
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleFollowListItem(userItem)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                            userItem.isFollowing
                              ? "border border-[#E6E5E0] bg-[#F5F4F0] text-[#17191A] hover:bg-[#EFEFEA]"
                              : "bg-[#184A45] text-white hover:bg-[#133D39]"
                          }`}
                        >
                          {userItem.isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Following List */}
        {activeTab === "following" && (
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-[#17191A] mb-4">
              Colleagues followed by {name}
            </h2>

            {isLoadingList ? (
              <div className="py-12 text-center text-xs text-[#6C6F71]">
                Loading following...
              </div>
            ) : listError ? (
              <div className="py-8 text-center text-xs text-[#9E3B27]">
                {listError}
              </div>
            ) : !followingList || followingList.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-[#17191A]">
                  Not following anyone yet
                </p>
                <p className="text-xs text-[#6C6F71] mt-1">
                  Connect with practitioners and specialists across the network.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDECE8]">
                {followingList.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/profile/${userItem.id}`}
                      className="flex items-center gap-3 min-w-0 group"
                    >
                      <Avatar
                        src={userItem.avatarUrl}
                        alt={userItem.name}
                        fallbackName={userItem.name}
                        size={40}
                        className="h-10 w-10 rounded-md border border-[#E6E5E0] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#17191A] group-hover:text-[#184A45] transition truncate">
                          {userItem.name}
                        </h4>
                        <p className="text-xs text-[#6C6F71] truncate">
                          {userItem.bio || "Member"}
                        </p>
                      </div>
                    </Link>

                    {/* Right: Following Action / You Badge */}
                    <div className="shrink-0">
                      {userItem.isSelf ? (
                        <span className="rounded bg-[#F5F4F0] px-2.5 py-1 text-xs font-medium text-[#6C6F71] border border-[#E6E5E0]">
                          You
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleFollowListItem(userItem)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                            userItem.isFollowing
                              ? "border border-[#E6E5E0] bg-[#F5F4F0] text-[#17191A] hover:bg-[#EFEFEA]"
                              : "bg-[#184A45] text-white hover:bg-[#133D39]"
                          }`}
                        >
                          {userItem.isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block h-full min-h-0 overflow-y-auto no-scrollbar py-6 pl-1 shrink-0">
        <RightSidebar
          userName={currentUser?.name}
          suggestedUsers={suggestedUsers}
        />
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="w-full max-w-md rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EDECE8]">
              <h3 className="text-base font-bold text-[#17191A]">Edit Profile</h3>
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

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              {editError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-[#9E3B27]">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#17191A] mb-1">
                  Full Name
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

              <div>
                <label className="block text-xs font-semibold text-[#17191A] mb-1">
                  Professional Headline / Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-lg border border-[#E6E5E0] bg-[#FBFBFA] p-3 text-sm text-[#17191A] placeholder-[#8A8D90] focus:border-[#184A45] focus:outline-hidden transition resize-none"
                  placeholder="e.g. Systems & Software Engineer passionate about distributed data architectures."
                />
                <div className="text-right text-[11px] text-[#8A8D90] mt-1">
                  {editBio.length}/500
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EDECE8]">
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
                  className="rounded-lg bg-[#184A45] px-4.5 py-2 text-xs font-semibold text-white hover:bg-[#133D39] transition cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF0EE] text-[#9E3B27] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
              </svg>
            </div>

            {/* Modal Text */}
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#17191A]">
                Unfollow {name}?
              </h3>
              <p className="text-xs text-[#6C6F71] leading-relaxed px-2">
                Their posts will no longer appear in your feed, and you will no longer be able to message them directly.
              </p>
            </div>

            {/* Actions */}
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
