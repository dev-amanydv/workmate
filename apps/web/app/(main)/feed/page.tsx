import { headers } from "next/headers";
import { FeedView } from "../../../components/feed/feed-view";
import type { SuggestedUser } from "../../../components/feed/right-sidebar";
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

export default async function FeedPage() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let user: UserProfile | null = null;
  let initialPosts: Post[] = [];
  let suggestedUsers: SuggestedUser[] = [];

  try {
    user = await apiFetch<UserProfile>("/users/me", {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    user = null;
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

  try {
    const res = await apiFetch<any>("/users/suggested", {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (Array.isArray(res)) {
      suggestedUsers = res;
    } else if (res && Array.isArray(res.data)) {
      suggestedUsers = res.data;
    }
  } catch {
    suggestedUsers = [];
  }

  return (
    <FeedView
      userName={user?.name}
      userAvatar={user?.avatarUrl}
      userId={user?.id}
      initialPosts={initialPosts}
      initialSuggestedUsers={suggestedUsers}
    />
  );
}
