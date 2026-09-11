"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "../../lib/api/client";
import type { UserProfile } from "../../types/user";

interface UserListItemProps {
  user: UserProfile;
  mutualCount?: number;
  mutualAvatars?: string[];
}

export function UserListItem({
  user,
  mutualCount = 8,
  mutualAvatars = [
    "/mock/avatar-rohan.jpg",
    "/mock/avatar-priya.jpg",
    "/mock/avatar-arjun.jpg",
  ],
}: UserListItemProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [isToggling, setIsToggling] = useState(false);
  const [imageError, setImageError] = useState(false);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling || user.isSelf) return;

    setIsToggling(true);
    const nextFollowing = !isFollowing;

    // Optimistic UI update
    setIsFollowing(nextFollowing);

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
      // If error (e.g. simulated user), keep state or revert
      setIsFollowing(nextFollowing);
    } finally {
      setIsToggling(false);
    }
  };

  const userInitial = (user.name || "U").charAt(0).toUpperCase();
  const displayMutualCount =
    mutualCount || (user.followersCount > 0 ? user.followersCount : 5);

  return (
    <div className="py-4.5 border-b border-slate-100 last:border-0 transition hover:bg-slate-50/50 -mx-3 px-3 rounded-2xl">
      <div className="flex items-center justify-between gap-4">
        {/* Clickable Profile Area */}
        <Link
          href={`/profile/${user.id}`}
          className="flex items-center gap-4 flex-1 min-w-0 group"
        >
          {/* 48px Circular Avatar */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-100 flex items-center justify-center shadow-2xs">
            {user.avatarUrl && !imageError ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized={user.avatarUrl.startsWith("http")}
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-blue-600">
                {userInitial}
              </span>
            )}
          </div>

          {/* Middle Info: Name, Bio, Mutual Connections (NO EMAIL) */}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition truncate">
              {user.name}
            </h3>

            <p className="text-[13px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
              {user.bio || "Workmate Member"}
            </p>

            {/* Overlapping tiny avatars + Mutual connections text */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                {mutualAvatars.slice(0, 3).map((av, idx) => (
                  <div
                    key={idx}
                    className="relative h-4 w-4 rounded-full overflow-hidden border border-white bg-slate-200"
                  >
                    <Image
                      src={av}
                      alt=""
                      width={16}
                      height={16}
                      className="h-full w-full object-cover"
                      unoptimized={av.startsWith("http")}
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-normal truncate">
                {displayMutualCount} mutual connection{displayMutualCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </Link>

        {/* Right: Follow Button */}
        <div className="shrink-0">
          {user.isSelf ? (
            <span className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
              You
            </span>
          ) : (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={isToggling}
              className={`rounded-xl px-5 py-2 text-xs font-semibold transition cursor-pointer active:scale-[0.98] ${
                isFollowing
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  : "bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
