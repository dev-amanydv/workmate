"use client";

import { useState } from "react";
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

interface RightSidebarProps {
  userName?: string;
  suggestedUsers?: SuggestedUser[];
}

export function RightSidebar({
  userName = "You",
  suggestedUsers = [],
}: RightSidebarProps) {
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    suggestedUsers.forEach((u) => {
      initial[u.id] = u.isFollowing ?? false;
    });
    return initial;
  });

  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});

  const toggleFollow = async (userId: string) => {
    if (togglingMap[userId]) return;

    setTogglingMap((prev) => ({ ...prev, [userId]: true }));

    const prevFollowing = followingMap[userId] ?? false;
    const nextFollowing = !prevFollowing;

    // Optimistic UI update
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
      // Revert optimistic state on error
      setFollowingMap((prev) => ({
        ...prev,
        [userId]: prevFollowing,
      }));
    } finally {
      setTogglingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const usersToDisplay = suggestedUsers;

  return (
    <aside className="w-full flex flex-col gap-5">
      {/* 1. Good evening Widget */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between overflow-hidden">
        <div className="space-y-0.5">
          <p className="text-xs text-slate-500 font-medium">Good evening,</p>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <span>{userName}</span>
            <span>👋</span>
          </h3>
        </div>

        <div className="relative h-12 w-28 shrink-0 overflow-hidden rounded-lg">
          <Image
            src="/mock/mountain-illustration.jpg"
            alt="Mountains"
            width={140}
            height={50}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* 2. Inspirational Quote Widget */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-start gap-2.5">
          {/* Blue giant quotation mark */}
          <span className="text-blue-600 font-serif font-black text-2xl leading-none select-none">
            “
          </span>
          <div className="space-y-3">
            <p className="italic text-xs font-semibold text-slate-700 leading-relaxed">
              Progress happens when people share, support, and build together.
            </p>
            <p className="text-[11px] text-slate-400 font-normal pt-1 border-t border-slate-100">
              A more open, kind, and productive internet.
            </p>
          </div>
        </div>
      </div>

      {/* 3. People You May Like Widget */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-2">
          <h3 className="text-sm font-bold text-slate-900">People you may like</h3>
          <Link
            href="/network"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            See all
          </Link>
        </div>

        {usersToDisplay.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">
            No recommendations right now.
          </p>
        ) : (
          <div className="space-y-4">
            {usersToDisplay.map((user) => {
              const isFollowing = followingMap[user.id] ?? false;
              const isToggling = togglingMap[user.id] ?? false;

              return (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition"
                  >
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-2xs bg-blue-50 flex items-center justify-center">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.name}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                          unoptimized={user.avatarUrl.startsWith("http")}
                        />
                      ) : (
                        <span className="text-xs font-bold text-blue-600">
                          {(user.name || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate hover:text-blue-600 transition">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.role}
                      </p>
                    </div>
                  </Link>

                <button
                  type="button"
                  onClick={() => toggleFollow(user.id)}
                  disabled={isToggling}
                  className={`shrink-0 rounded-lg px-3.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    isFollowing
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50/70"
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

      {/* 4. Meaningful Connections Promo Card */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100/70 bg-gradient-to-br from-[#EAF2FE] via-[#F4F8FE] to-[#DFECFE] p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="relative z-10 flex-1">
          <p className="text-xs font-bold text-slate-800 leading-snug">
            Meaningful connections lead to extraordinary opportunities.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition mt-3"
          >
            <span>Find people</span>
            <span className="text-sm leading-none">→</span>
          </Link>
        </div>

        <div className="relative z-10 h-16 w-24 shrink-0 overflow-hidden rounded-lg">
          <Image
            src="/mock/connections-illustration.jpg"
            alt="Collaborative team"
            width={115}
            height={75}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Soft background ambient gradient */}
        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-blue-300/20 blur-xl pointer-events-none" />
      </div>
    </aside>
  );
}
