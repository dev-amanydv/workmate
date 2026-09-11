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
          role: p.author.role || "Workmate Member",
          avatarUrl: p.author.avatarUrl || null,
          isFollowing: p.author.isFollowing ?? false,
        });
      }
    });

    return realAuthors.slice(0, 3);
  }, [initialSuggestedUsers, posts, userId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start">
      {/* Left Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <LeftSidebar userId={userId} />
      </div>

      {/* Center Feed Column */}
      <div className="flex flex-col gap-5 min-w-0">
        {/* Create Post Prompt Card */}
        <CreatePostPrompt userAvatar={userAvatar} userName={userName} />

        {/* Feed Posts List */}
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
              <p className="mt-1 text-xs text-slate-500">
                Be the first to share an update with your network!
              </p>
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

      {/* Right Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <RightSidebar userName={userName} suggestedUsers={suggestedUsers} />
      </div>
    </div>
  );
}
