"use client";

import Link from "next/link";
import { useState } from "react";
import { LeftSidebar } from "../feed/left-sidebar";
import { RightSidebar, type SuggestedUser } from "../feed/right-sidebar";
import type { Post } from "../../types/post";
import type { UserProfile } from "../../types/user";
import { PostCard } from "./post-card";

interface PostDetailViewProps {
  initialPost: Post;
  currentUserId?: string;
  currentUser?: UserProfile | { id: string; name?: string; avatarUrl?: string | null } | null;
  suggestedUsers?: SuggestedUser[];
}

export function PostDetailView({
  initialPost,
  currentUserId,
  currentUser,
  suggestedUsers = [],
}: PostDetailViewProps) {
  const [post, setPost] = useState<Post>(initialPost);
  const effectiveUserId = currentUser?.id || currentUserId;
  const effectiveUserName = currentUser?.name || "You";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start h-full overflow-hidden">
      {/* Left Sidebar: Fixed navigation column */}
      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pr-1 shrink-0">
        <LeftSidebar userId={effectiveUserId} />
      </div>

      {/* Center Column: The component that scrolls */}
      <div className="h-full overflow-y-auto no-scrollbar py-6 px-1 min-w-0 flex flex-col gap-4 pb-12">
        <div className="flex items-center justify-between">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#484B4D] hover:text-[#17191A] hover:bg-[#F5F4F0] transition"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to feed</span>
          </Link>
        </div>

        <PostCard
          post={post}
          currentUserId={effectiveUserId}
          onPostUpdated={(updated) => setPost(updated)}
          isDetailView={true}
        />
      </div>

      {/* Right Sidebar: Fixed suggested follows column */}
      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pl-1 shrink-0">
        <RightSidebar
          userName={effectiveUserName}
          suggestedUsers={suggestedUsers}
        />
      </div>
    </div>
  );
}

