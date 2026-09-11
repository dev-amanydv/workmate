"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const [imageError, setImageError] = useState(false);

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
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {/* Top Bar: Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {isRecentBadge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Recently Joined
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Joined {formatRelativeTime(user.createdAt)}
          </span>
        )}

        {user.isSelf && (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 border border-blue-100">
            You
          </span>
        )}
      </div>

      {/* Main Info */}
      <Link href={`/profile/${user.id}`} className="group/profile block">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-2xs bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            {user.avatarUrl && !imageError ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={52}
                height={52}
                className="h-full w-full object-cover"
                unoptimized={user.avatarUrl.startsWith("http")}
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-base font-bold text-blue-600">
                {userInitial}
              </span>
            )}
          </div>

          {/* Name, Email, Bio */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 truncate group-hover/profile:text-blue-600 transition">
              {user.name}
            </h3>

            {/* Email */}
            <div className="flex items-center gap-1 mt-0.5 text-[12px] text-slate-500 truncate">
              <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="truncate">{user.email}</span>
            </div>

            {/* Bio / Role */}
            <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {user.bio || "Workmate Member"}
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
            className="flex-1 rounded-xl bg-slate-100 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Your Profile
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleFollow}
              disabled={isToggling}
              className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                isFollowing
                  ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200"
                  : "bg-blue-600 text-white shadow-xs hover:bg-blue-700 active:scale-[0.98]"
              }`}
            >
              {isFollowing ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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

            <Link
              href="/chat"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
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
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Profile
        </Link>
      </div>
    </div>
  );
}
