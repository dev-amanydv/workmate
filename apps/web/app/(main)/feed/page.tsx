import { headers } from "next/headers";
import { FeedView } from "../../../components/feed/feed-view";
import { apiFetch } from "../../../lib/api/client";
import type { Post } from "../../../types/post";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

const DEFAULT_USER: UserProfile = {
  id: "user-aman",
  email: "aman@workmate.dev",
  name: "Aman",
  bio: "Building delightful digital experiences.",
  avatarUrl: "/mock/avatar-aman.jpg",
  createdAt: "2024-01-01T00:00:00.000Z",
};

export default async function FeedPage() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let user: UserProfile = DEFAULT_USER;
  let initialPosts: Post[] = [];

  try {
    user = await apiFetch<UserProfile>("/users/me", {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    user = DEFAULT_USER;
  }

  try {
    const res = await apiFetch<any>("/posts", {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (Array.isArray(res)) {
      initialPosts = res;
    } else if (res && Array.isArray(res.data)) {
      initialPosts = res.data;
    } else if (res && Array.isArray(res.posts)) {
      initialPosts = res.posts;
    }
  } catch {
    initialPosts = [];
  }

  return (
    <FeedView
      userName={user.name || "Aman"}
      userAvatar={user.avatarUrl || "/mock/avatar-aman.jpg"}
      userId={user.id}
      initialPosts={initialPosts}
    />
  );
}
