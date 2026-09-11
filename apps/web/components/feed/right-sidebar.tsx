"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "../../lib/api/client";

export interface SuggestedUser {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  isFollowing?: boolean;
}

const DEFAULT_SUGGESTED_USERS: SuggestedUser[] = [
  {
    id: "rohan-mehta",
    name: "Rohan Mehta",
    role: "Staff Infrastructure Engineer at Stripe",
    avatarUrl: "/mock/avatar-rohan.jpg",
    isFollowing: false,
  },
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    role: "Principal Product Designer at Figma",
    avatarUrl: "/mock/avatar-priya.jpg",
    isFollowing: false,
  },
  {
    id: "arjun-nair",
    name: "Arjun Nair",
    role: "Systems & Database Engineer at Zepto",
    avatarUrl: "/mock/avatar-arjun.jpg",
    isFollowing: false,
  },
  {
    id: "sneha-kapoor",
    name: "Sneha Kapoor",
    role: "Compiler Engineer at Workmate",
    avatarUrl: "/mock/avatar-sneha.jpg",
    isFollowing: false,
  },
];

interface RightSidebarProps {
  userName?: string;
  suggestedUsers?: SuggestedUser[];
}

export function RightSidebar({
  userName = "You",
  suggestedUsers = [],
}: RightSidebarProps) {
  const usersToDisplay = useMemo(() => {
    const combined = [...suggestedUsers];
    const seenIds = new Set(combined.map((u) => u.id));

    for (const defUser of DEFAULT_SUGGESTED_USERS) {
      if (combined.length >= 3) break;
      if (!seenIds.has(defUser.id)) {
        combined.push(defUser);
        seenIds.add(defUser.id);
      }
    }

    return combined.slice(0, 3);
  }, [suggestedUsers]);

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    usersToDisplay.forEach((u) => {
      initial[u.id] = u.isFollowing ?? false;
    });
    return initial;
  });

  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFollowingMap((prev) => {
      const updated = { ...prev };
      usersToDisplay.forEach((u) => {
        if (updated[u.id] === undefined) {
          updated[u.id] = u.isFollowing ?? false;
        }
      });
      return updated;
    });
  }, [usersToDisplay]);

  const toggleFollow = async (userId: string) => {
    if (togglingMap[userId]) return;

    setTogglingMap((prev) => ({ ...prev, [userId]: true }));

    const prevFollowing = followingMap[userId] ?? false;
    const nextFollowing = !prevFollowing;

    setFollowingMap((prev) => ({
      ...prev,
      [userId]: nextFollowing,
    }));

    try {
      const res = await apiFetch<{ success: boolean; isFollowing: boolean }>(
        `/follows/${userId}`,
        {
          method: nextFollowing ? "POST" : "DELETE",
        },
      );
      if (res && typeof res.isFollowing === "boolean") {
        setFollowingMap((prev) => ({
          ...prev,
          [userId]: res.isFollowing,
        }));
      }
    } catch {
      if (DEFAULT_SUGGESTED_USERS.some((d) => d.id === userId)) {
        setFollowingMap((prev) => ({
          ...prev,
          [userId]: nextFollowing,
        }));
      } else {
        setFollowingMap((prev) => ({
          ...prev,
          [userId]: prevFollowing,
        }));
      }
    } finally {
      setTogglingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <aside className="w-full flex flex-col gap-4">




      {/* 3. Suggested Collaborators (Specific roles, high-contrast actions) */}
      <div className="rounded-xl border border-[#E6E5E0] bg-[#F5F4F0] p-4">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EDECE8]">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#17191A]">
              Suggested Peers
            </h3>
            <p className="text-[11px] text-[#6C6F71]">Based on shared craft</p>
          </div>
          <Link
            href="/search"
            className="text-xs font-medium text-[#184A45] hover:underline transition"
          >
            Directory
          </Link>
        </div>

        {usersToDisplay.length === 0 ? (
          <p className="text-xs text-[#6C6F71] py-2 text-center">
            No recommendations currently.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {usersToDisplay.map((user) => {
              const isFollowing = followingMap[user.id] ?? false;
              const isToggling = togglingMap[user.id] ?? false;

              return (
                <div key={user.id} className="flex items-center justify-between gap-2.5">
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition"
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-[#E6E5E0] bg-[#EEF4F3] flex items-center justify-center">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                          unoptimized={user.avatarUrl.startsWith("http")}
                        />
                      ) : (
                        <span className="text-xs font-semibold text-[#184A45]">
                          {(user.name || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#17191A] truncate hover:text-[#184A45] transition">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#6C6F71] truncate">
                        {user.role}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => toggleFollow(user.id)}
                    disabled={isToggling}
                    className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                      isFollowing
                        ? "bg-[#EFEFEA] text-[#17191A] border border-[#D5D3CC] hover:bg-[#E5E4DE]"
                        : "bg-[#184A45] text-white hover:bg-[#133D39]"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
    </aside>
  );
}
