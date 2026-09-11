"use client";

import { useMemo, useState } from "react";
import { LeftSidebar } from "./left-sidebar";
import { CreatePostPrompt } from "./create-post-prompt";
import { FeedPostCard } from "./feed-post-card";
import { RightSidebar, type SuggestedUser } from "./right-sidebar";
import type { Post } from "../../types/post";

const DEFAULT_MOCK_POSTS: Post[] = [
  {
    id: "mock-rohan-mehta",
    authorId: "mock-user-rohan",
    author: {
      id: "mock-user-rohan",
      name: "Rohan Mehta",
      role: "Senior Software Engineer at Stripe",
      avatarUrl: "/mock/avatar-rohan.jpg",
      isFollowing: false,
    },
    content:
      "Spent the last few weeks building a developer tool to make API testing less painful. It started as a personal project, but it's now something I think can really help others.\n\nWould love your feedback! 🚀",
    imageUrl: "/mock/rohan-post.jpg",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likesCount: 422,
    isLiked: true,
    isMock: true,
  },
  {
    id: "mock-priya-sharma",
    authorId: "mock-user-priya",
    author: {
      id: "mock-user-priya",
      name: "Priya Sharma",
      role: "Product Manager at Google",
      avatarUrl: "/mock/avatar-priya.jpg",
      isFollowing: false,
    },
    content:
      "Small progress, big motivation.\n\nOur team just shipped a new onboarding flow, and we saw a 30% increase in activation rate! Grateful for this amazing team that turns ideas into impact every day. 💙",
    imageUrl: "/mock/priya-post.jpg",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likesCount: 139,
    isLiked: false,
    isMock: true,
  },
];

interface FeedViewProps {
  userName?: string;
  userAvatar?: string;
  userId?: string;
  initialPosts?: Post[];
}

export function FeedView({
  userName = "Aman",
  userAvatar = "/mock/avatar-aman-large.jpg",
  userId = "user-aman",
  initialPosts = [],
}: FeedViewProps) {
  // If real posts are passed from backend, use them; if empty, use the mock posts
  const [posts, setPosts] = useState<Post[]>(() => {
    if (initialPosts.length > 0) {
      // Real posts at top, followed by mock posts to preserve rich sample UI
      return [...initialPosts, ...DEFAULT_MOCK_POSTS];
    }
    return DEFAULT_MOCK_POSTS;
  });

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Derive suggested users from real post authors (excluding current user)
  const suggestedUsers = useMemo<SuggestedUser[]>(() => {
    const defaultList: SuggestedUser[] = [
      {
        id: "neha",
        name: "Neha Verma",
        role: "Frontend Developer",
        avatarUrl: "/mock/avatar-neha.jpg",
        isFollowing: false,
      },
      {
        id: "arjun",
        name: "Arjun Kapoor",
        role: "Product Designer",
        avatarUrl: "/mock/avatar-arjun.jpg",
        isFollowing: false,
      },
      {
        id: "sneha",
        name: "Sneha Iyer",
        role: "Software Engineer",
        avatarUrl: "/mock/avatar-sneha.jpg",
        isFollowing: false,
      },
    ];

    const realAuthors: SuggestedUser[] = [];
    const seenIds = new Set<string>();

    posts.forEach((p) => {
      if (!p.isMock && p.authorId !== userId && !seenIds.has(p.authorId)) {
        seenIds.add(p.authorId);
        realAuthors.push({
          id: p.author.id || p.authorId,
          name: p.author.name,
          role: p.author.role || "Workmate Member",
          avatarUrl: p.author.avatarUrl || "/mock/avatar-rohan.jpg",
          isFollowing: p.author.isFollowing ?? false,
        });
      }
    });

    if (realAuthors.length > 0) {
      return [...realAuthors, ...defaultList].slice(0, 4);
    }

    return defaultList;
  }, [posts, userId]);

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
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <RightSidebar userName={userName} suggestedUsers={suggestedUsers} />
      </div>
    </div>
  );
}
