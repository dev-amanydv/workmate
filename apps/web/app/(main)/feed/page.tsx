import { headers } from "next/headers";
import { FeedView } from "../../../components/feed/feed-view";
import type { SuggestedUser } from "../../../components/feed/right-sidebar";
import { apiFetch } from "../../../lib/api/client";
import { getCurrentUser } from "../../../lib/api/user";
import type { Post } from "../../../types/post";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface FeedPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: "dispatch-1",
    authorId: "rohan-mehta",
    author: {
      id: "rohan-mehta",
      name: "Rohan Mehta",
      role: "Staff Infrastructure Engineer at Stripe",
      avatarUrl: "/mock/avatar-rohan.jpg",
      isFollowing: false,
    },
    content: "We migrated our event ingestion pipeline to a partitioned log architecture last month. The unexpected bottleneck was not disk I/O or network saturation—it was GC pressure caused by deserializing high-throughput JSON payloads.\n\nSwitching to a zero-allocation binary codec cut our p99 latency from 142ms down to 18ms and reduced fleet memory footprint by 40%. Lesson: measure allocations before upgrading machine instances.",
    imageUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likesCount: 38,
    isLiked: false,
  },
  {
    id: "dispatch-2",
    authorId: "priya-sharma",
    author: {
      id: "priya-sharma",
      name: "Priya Sharma",
      role: "Principal Product Designer at Figma",
      avatarUrl: "/mock/avatar-priya.jpg",
      isFollowing: false,
    },
    content: "Design systems often fail when they prioritize component purity over developer velocity.\n\nA robust token system must handle real-world exceptions without breaking the underlying mental model. If engineers have to write custom CSS overrides for every dense data table, the system is introducing friction rather than protecting consistency.",
    imageUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    likesCount: 54,
    isLiked: true,
  },
];

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = searchParams ? await searchParams : {};
  const showEmpty = params.empty === "true" || params.empty === "1";

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  const [user, postsRaw, suggestedRaw] = await Promise.all([
    getCurrentUser(cookieHeader),
    apiFetch<any>("/posts", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
    apiFetch<any>("/users/suggested", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
  ]);

  let initialPosts: Post[] = [];
  if (Array.isArray(postsRaw)) {
    initialPosts = postsRaw;
  } else if (postsRaw && Array.isArray(postsRaw.data)) {
    initialPosts = postsRaw.data;
  } else if (postsRaw && Array.isArray(postsRaw.posts)) {
    initialPosts = postsRaw.posts;
  }

  if (!showEmpty && initialPosts.length === 0) {
    initialPosts = SAMPLE_POSTS;
  }

  let suggestedUsers: SuggestedUser[] = [];
  if (Array.isArray(suggestedRaw)) {
    suggestedUsers = suggestedRaw;
  } else if (suggestedRaw && Array.isArray(suggestedRaw.data)) {
    suggestedUsers = suggestedRaw.data;
  }

  return (
    <FeedView
      userName={user?.name || "Aman Yadav"}
      userAvatar={user?.avatarUrl || "/mock/avatar-aman.jpg"}
      userId={user?.id || "user-me"}
      initialPosts={initialPosts}
      initialSuggestedUsers={suggestedUsers}
    />
  );
}
