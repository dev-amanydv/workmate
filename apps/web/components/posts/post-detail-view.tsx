"use client";

import Link from "next/link";
import { useState } from "react";
import type { Post } from "../../types/post";
import { PostCard } from "./post-card";

interface PostDetailViewProps {
  initialPost: Post;
  currentUserId: string;
}

export function PostDetailView({
  initialPost,
  currentUserId,
}: PostDetailViewProps) {
  const [post, setPost] = useState<Post>(initialPost);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white"
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
        currentUserId={currentUserId}
        onPostUpdated={(updated) => setPost(updated)}
        isDetailView={true}
      />
    </div>
  );
}
