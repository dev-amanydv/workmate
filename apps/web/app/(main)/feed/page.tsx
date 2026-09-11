import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../../components/logout-button";
import { FeedPosts } from "../../../components/posts/feed-posts";
import { ApiError, apiFetch } from "../../../lib/api/client";
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
    // Also redirect on missing token or unauthenticated error
    redirect("/login");
  }

  let initialPosts: Post[] = [];
  try {
    initialPosts = await apiFetch<Post[]>("/posts", {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    initialPosts = [];
  }

  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
          <div className="relative mb-4 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300 sm:mb-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <LogoutButton />
              </div>
            </div>

            {user.bio ? (
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                {user.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-gray-400 dark:text-gray-500">
                No bio provided yet.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-neutral-800 dark:text-gray-400">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Member since:
                </span>{" "}
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Auth method:
                </span>{" "}
                Google OAuth 2.0
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeedPosts initialPosts={initialPosts} currentUserId={user.id} />
    </div>
  );
}
