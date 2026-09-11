"use client";

import { useState } from "react";
import type { Post } from "../../types/post";
import { CreatePostForm } from "./create-post-form";
import { PostCard } from "./post-card";

interface FeedPostsProps {
  initialPosts: Post[];
}

export function FeedPosts({ initialPosts }: FeedPostsProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="space-y-6">
      <CreatePostForm onPostCreated={handlePostCreated} />

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent Posts
        </h3>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-gray-400">
            No posts yet. Be the first to share an update!
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
