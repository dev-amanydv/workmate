"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "../feed/left-sidebar";
import { RightSidebar, type SuggestedUser } from "../feed/right-sidebar";
import { FeedPostCard } from "../feed/feed-post-card";
import { apiFetch } from "../../lib/api/client";
import type { Post } from "../../types/post";
import type { UserProfile } from "../../types/user";

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

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isFollowing, setIsFollowing] = useState<boolean>(profileUser.isFollowing);
  const [followersCount, setFollowersCount] = useState<number>(profileUser.followersCount);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isSelf = profileUser.isSelf || (currentUser?.id && currentUser.id === profileUser.id);
  const displayName = profileUser.name || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  // Format joined date
  const joinedDate = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  // Handle follow click:
  // If not following -> immediately follow
  // If already following -> open confirmation popup
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
    // Optimistic update
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
      // Revert on error
      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const confirmUnfollow = async () => {
    setShowUnfollowModal(false);
    setIsTogglingFollow(true);

    // Optimistic update
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
      // Revert on error
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  // Handle Message Button click:
  // Creates/gets conversation and redirects to /chat
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start">
      {/* Left Navigation Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <LeftSidebar userId={currentUser?.id} />
      </div>

      {/* Main Profile Center Column */}
      <div className="flex flex-col gap-6 min-w-0">
        {/* Profile Card */}
        <div className="overflow-hidden rounded-xl border border-[#E6E5E0] bg-white">
          {/* Cover Header Banner: Architectural Deep Mineral Pine with subtle craft texture */}
          <div className="relative h-40 sm:h-48 w-full bg-[#184A45] overflow-hidden">
            {/* Architectural structural grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />

            {/* Share Profile Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={handleShareProfile}
                className="flex items-center gap-1.5 rounded-md bg-white/15 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition cursor-pointer"
                title="Share profile"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                <span>{copiedLink ? "Copied" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Profile Header Content */}
          <div className="relative px-6 pb-6 pt-0 sm:px-8">
            {/* Avatar Row with overlapping layout */}
            <div className="flex flex-wrap items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
              {/* Profile Avatar */}
              <div className="relative h-24 w-24 sm:h-30 sm:w-30 rounded-lg border-4 border-white bg-[#EEF4F3] overflow-hidden flex items-center justify-center shrink-0">
                {profileUser.avatarUrl && !imageError ? (
                  <Image
                    src={profileUser.avatarUrl}
                    alt={displayName}
                    width={120}
                    height={120}
                    className="h-full w-full object-cover"
                    unoptimized={profileUser.avatarUrl.startsWith("http")}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-3xl font-semibold text-[#184A45]">
                    {userInitial}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {isSelf ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F4F0] px-3.5 py-1.5 text-xs font-medium text-[#17191A] border border-[#E6E5E0]">
                      Your Account
                    </span>
                    <Link
                      href="/posts/create"
                      className="rounded-lg bg-[#184A45] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#133D39] transition"
                    >
                      New Dispatch
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleFollowButtonClick}
                      disabled={isTogglingFollow}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                        isFollowing
                          ? "border border-[#E6E5E0] bg-[#F5F4F0] text-[#17191A] hover:bg-[#EFEFEA]"
                          : "bg-[#184A45] text-white hover:bg-[#133D39]"
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
                        <span>Follow</span>
                      )}
                    </button>

                    {/* Message Button */}
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

            {/* Name, Handle, & Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {displayName}
                </h1>
                {isSelf && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-blue-700">
                    You
                  </span>
                )}
              </div>

              {profileUser.email && (
                <p className="text-xs font-medium text-slate-400">
                  {profileUser.email}
                </p>
              )}

              {/* Bio */}
              <p className="text-sm text-slate-700 leading-relaxed max-w-2xl pt-1">
                {profileUser.bio || (
                  <span className="italic text-slate-400">No bio provided yet.</span>
                )}
              </p>

              {/* Joined Date */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span>Joined {joinedDate}</span>
              </div>
            </div>

            {/* Stats Row: Followers, Following, Posts */}
            <div className="mt-6 flex items-center gap-8 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900">
                  {followersCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {followersCount === 1 ? "Follower" : "Followers"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900">
                  {profileUser.followingCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">Following</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900">
                  {posts.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {posts.length === 1 ? "Post" : "Posts"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Heading: Posts Feed */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Posts</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {posts.length}
            </span>
          </div>
        </div>

        {/* Feed of Own Posts */}
        <div className="flex flex-col gap-5">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
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
              <h3 className="text-sm font-semibold text-slate-900">No posts yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {isSelf
                  ? "You haven't posted any updates yet. Share your thoughts or ideas with the network!"
                  : `${displayName} has not shared any posts yet.`}
              </p>
              {isSelf && (
                <div className="mt-4">
                  <Link
                    href="/posts/create"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
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
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <RightSidebar
          userName={currentUser?.name}
          suggestedUsers={suggestedUsers}
        />
      </div>

      {/* Confirmation Modal: Unfollow Confirmation Popup */}
      {showUnfollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Icon / Avatar */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
              </svg>
            </div>

            {/* Modal Text */}
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Unfollow {displayName}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                Their posts will no longer appear in your feed, and you will no longer be able to message them directly.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmUnfollow}
                disabled={isTogglingFollow}
                className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-[0.98] transition cursor-pointer"
              >
                Unfollow
              </button>
              <button
                type="button"
                onClick={() => setShowUnfollowModal(false)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
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
