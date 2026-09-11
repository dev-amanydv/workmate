"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
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
    <div className="py-3.5 border-b border-[#EDECE8] last:border-0 transition-colors hover:bg-[#F5F4F0] -mx-2 px-2 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        {/* Clickable Profile Area */}
        <Link
          href={`/profile/${user.id}`}
          className="flex items-center gap-3.5 flex-1 min-w-0 group"
        >
          {/* Avatar */}
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            fallbackName={user.name}
            size={44}
            className="h-11 w-11 rounded-md border border-[#E6E5E0] shrink-0"
          />

          {/* Middle Info: Name, Bio, Mutual Connections */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[#17191A] leading-snug group-hover:text-[#184A45] transition truncate">
              {user.name}
            </h3>

            <p className="text-xs text-[#6C6F71] font-normal leading-tight mt-0.5 truncate">
              {user.bio || "Member"}
            </p>

            {/* Overlapping tiny avatars + Mutual connections text */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                {mutualAvatars.slice(0, 3).map((av, idx) => (
                  <Avatar
                    key={idx}
                    src={av}
                    alt="Mutual"
                    fallbackName="M"
                    size={16}
                    className="h-4 w-4 rounded-full border border-white"
                  />
                ))}
              </div>
              <span className="text-[11px] text-[#8A8D90] font-normal truncate">
                {displayMutualCount} mutual colleague{displayMutualCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </Link>

        {/* Right: Follow Button */}
        <div className="shrink-0">
          {user.isSelf ? (
            <span className="rounded-md bg-[#F5F4F0] border border-[#E6E5E0] px-3 py-1.5 text-xs font-medium text-[#6C6F71]">
              You
            </span>
          ) : (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={isToggling}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                isFollowing
                  ? "bg-[#F5F4F0] text-[#17191A] hover:bg-[#EFEFEA] border border-[#E6E5E0]"
                  : "bg-[#184A45] text-white hover:bg-[#133D39]"
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
