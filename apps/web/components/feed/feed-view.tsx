"use client";

import { useMemo, useState } from "react";
import { LeftSidebar } from "./left-sidebar";
import { CreatePostPrompt } from "./create-post-prompt";
import { FeedPostCard } from "./feed-post-card";
import { RightSidebar, type SuggestedUser } from "./right-sidebar";
import type { Post } from "../../types/post";

interface FeedViewProps {
  userName?: string;
  userAvatar?: string | null;
  userId?: string;
  initialPosts?: Post[];
  initialSuggestedUsers?: SuggestedUser[];
}

export function FeedView({
  userName = "You",
  userAvatar,
  userId,
  initialPosts = [],
  initialSuggestedUsers = [],
}: FeedViewProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Derive suggested users from backend or real post authors (excluding current user)
  const suggestedUsers = useMemo<SuggestedUser[]>(() => {
    if (initialSuggestedUsers && initialSuggestedUsers.length > 0) {
      return initialSuggestedUsers;
    }

    const realAuthors: SuggestedUser[] = [];
    const seenIds = new Set<string>();

    posts.forEach((p) => {
      if (p.authorId && p.authorId !== userId && !seenIds.has(p.authorId)) {
        seenIds.add(p.authorId);
        realAuthors.push({
          id: p.author.id || p.authorId,
          name: p.author.name,
          role: p.author.role || "Member",
          avatarUrl: p.author.avatarUrl || null,
          isFollowing: p.author.isFollowing ?? false,
        });
      }
    });

    return realAuthors.slice(0, 3);
  }, [initialSuggestedUsers, posts, userId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start h-full overflow-hidden">
      {/* Left Sidebar: Fixed navigation column */}
      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pr-1 shrink-0">
        <LeftSidebar userId={userId} />
      </div>

      {/* Center Feed Column: The ONLY component that scrolls */}
      <div className="h-full overflow-y-auto no-scrollbar py-6 px-1 min-w-0 flex flex-col gap-5">
        
        {/* Feed Posts List */}
        <div className="flex flex-col gap-4 pb-12">
          {posts.length === 0 ? (
            <div className="rounded-xl border-px  bg-white p-10 sm:p-14 text-center">
              {/* Bespoke Architectural Chronicle Empty State Mark */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[#f3f3f1] bg-[#F5F4F0] text-[#184A45]">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#17191A]">
                Your feed is quiet
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-[#6C6F71] leading-relaxed">
                Connect with other users in the directory to see their updates, or create your first post.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/search"
                  className="rounded-lg bg-[#184A45] hover:bg-[#133D39] text-white px-4 py-2 text-xs font-semibold transition"
                >
                  Explore directory
                </a>
                <a
                  href="/posts/create"
                  className="rounded-lg border border-[#E6E5E0] bg-[#F5F4F0] hover:bg-[#EFEFEA] text-[#17191A] px-4 py-2 text-xs font-semibold transition"
                >
                  Create post
                </a>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUserId={userId}
                onPostDeleted={handlePostDeleted}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar: Fixed suggested follows column */}
      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pl-1 shrink-0">
        <RightSidebar userName={userName} suggestedUsers={suggestedUsers} />
      </div>
    </div>
  );
}
