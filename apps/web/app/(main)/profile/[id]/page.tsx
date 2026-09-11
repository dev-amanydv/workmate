import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileView } from "../../../../components/profile/profile-view";
import type { SuggestedUser } from "../../../../components/feed/right-sidebar";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import type { Post } from "../../../../types/post";
import type { UserProfile } from "../../../../types/user";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let currentUser: UserProfile | null = null;
  try {
    currentUser = await apiFetch<UserProfile>("/users/me", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    redirect("/login");
  }

  let profileUser: UserProfile | null = null;
  try {
    profileUser = await apiFetch<UserProfile>(`/users/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    profileUser = null;
  }

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-xl text-center py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">User not found</h2>
          <p className="mt-2 text-xs text-slate-500">
            The profile you are looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              href="/feed"
              className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let userPosts: Post[] = [];
  try {
    const res = await apiFetch<any>(`/posts?authorId=${id}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (Array.isArray(res)) {
      userPosts = res;
    } else if (res && Array.isArray(res.data)) {
      userPosts = res.data;
    } else if (res && Array.isArray(res.posts)) {
      userPosts = res.posts;
    }
  } catch {
    userPosts = [];
  }

  let suggestedUsers: SuggestedUser[] = [];
  try {
    const res = await apiFetch<any>("/users/suggested", {
      headers: { Cookie: cookieHeader },
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
    <ProfileView
      profileUser={profileUser}
      currentUser={currentUser}
      initialPosts={userPosts}
      suggestedUsers={suggestedUsers}
    />
  );
}
