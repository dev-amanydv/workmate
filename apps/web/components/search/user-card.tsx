"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "../ui/avatar";
import { apiFetch } from "../../lib/api/client";
import { formatRelativeTime } from "../../lib/utils/time";
import type { UserProfile } from "../../types/user";

interface UserCardProps {
  user: UserProfile;
  isRecentBadge?: boolean;
}

export function UserCard({ user, isRecentBadge = false }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [isToggling, setIsToggling] = useState(false);
  const [followersCount, setFollowersCount] = useState(user.followersCount);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling || user.isSelf) return;

    setIsToggling(true);
    const nextFollowing = !isFollowing;

    // Optimistic UI update
    setIsFollowing(nextFollowing);
    setFollowersCount((prev) => (nextFollowing ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await apiFetch<{ success: boolean; isFollowing: boolean }>(
        `/follows/${user.id}`,
        {
          method: nextFollowing ? "POST" : "DELETE",
        },
      );
      if (res && typeof res.isFollowing === "boolean") {
        setIsFollowing(res.isFollowing);
      }
    } catch {
      // Revert state on error
      setIsFollowing(!nextFollowing);
      setFollowersCount((prev) => (!nextFollowing ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsToggling(false);
    }
  };

  const userInitial = (user.name || "U").charAt(0).toUpperCase();

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-[#E6E5E0] bg-white p-5 transition-colors hover:border-[#D5D3CC]">
      {/* Top Bar: Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {isRecentBadge ? (
          <span className="inline-flex items-center gap-1 rounded bg-[#EEF4F3] px-2 py-0.5 text-[11px] font-semibold text-[#184A45] border border-[#D5D3CC]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#184A45]" />
            Recent Member
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6C6F71]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Joined {formatRelativeTime(user.createdAt)}
          </span>
        )}

        {user.isSelf && (
          <span className="rounded bg-[#F5F4F0] px-2 py-0.5 text-[11px] font-medium text-[#184A45] border border-[#E6E5E0]">
            You
          </span>
        )}
      </div>

      {/* Main Info */}
      <Link href={`/profile/${user.id}`} className="group/profile block">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            fallbackName={user.name}
            size={48}
            className="h-12 w-12 rounded-md border border-[#E6E5E0] shrink-0"
          />

          {/* Name, Email, Bio */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[#17191A] truncate group-hover/profile:text-[#184A45] transition">
              {user.name}
            </h3>

            {/* Email */}
            <div className="flex items-center gap-1 mt-0.5 text-xs text-[#6C6F71] truncate">
              <span className="truncate">{user.email}</span>
            </div>

            {/* Bio / Role */}
            <p className="mt-1.5 text-xs text-[#6C6F71] line-clamp-2 leading-relaxed">
              {user.bio || "Member"}
            </p>
          </div>
        </div>
      </Link>

      {/* Stats Bar */}
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-800">
          {followersCount}{" "}
          <span className="font-normal text-slate-500">
            {followersCount === 1 ? "follower" : "followers"}
          </span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="font-semibold text-slate-800">
          {user.followingCount}{" "}
          <span className="font-normal text-slate-500">following</span>
        </span>
        {user.postsCount > 0 && (
          <>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-800">
              {user.postsCount}{" "}
              <span className="font-normal text-slate-500">
                {user.postsCount === 1 ? "post" : "posts"}
              </span>
            </span>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2">
        {user.isSelf ? (
          <Link
            href="/profile"
            className="flex-1 rounded-lg bg-[#F5F4F0] border border-[#E6E5E0] py-2 text-center text-xs font-semibold text-[#17191A] hover:bg-[#EFEFEA] transition"
          >
            Your Profile
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleFollow}
              disabled={isToggling}
              className={`flex-1 rounded-lg py-2 px-3 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                isFollowing
                  ? "border border-[#E6E5E0] bg-[#F5F4F0] text-[#17191A] hover:bg-[#EFEFEA]"
                  : "bg-[#184A45] text-white hover:bg-[#133D39]"
              }`}
            >
              {isFollowing ? (
                <>
                  <svg className="w-3.5 h-3.5 text-[#184A45]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Following</span>
                </>
              ) : (
                <span>Follow</span>
              )}
            </button>

            <Link
              href="/chat"
              className="rounded-lg border border-[#E6E5E0] bg-white p-2 text-[#6C6F71] hover:bg-[#F5F4F0] hover:text-[#184A45] transition"
              title={`Message ${user.name}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </Link>
          </>
        )}

        <Link
          href={`/profile/${user.id}`}
          className="rounded-lg border border-[#E6E5E0] bg-white px-3 py-2 text-xs font-semibold text-[#17191A] hover:bg-[#F5F4F0] transition"
        >
          Profile
        </Link>
      </div>
    </div>
  );
}
