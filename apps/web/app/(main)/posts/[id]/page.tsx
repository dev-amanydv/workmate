import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PostDetailView } from "../../../../components/posts/post-detail-view";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import type { Post } from "../../../../types/post";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let user: UserProfile;
  try {
    user = await apiFetch<UserProfile>("/users/me", {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    redirect("/login");
  }

  let post: Post | null = null;
  try {
    post = await apiFetch<Post>(`/posts/${id}`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    post = null;
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Post not found
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This post may have been deleted or is no longer available.
          </p>
          <div className="mt-6">
            <Link
              href="/feed"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PostDetailView initialPost={post} currentUserId={user.id} />;
}
