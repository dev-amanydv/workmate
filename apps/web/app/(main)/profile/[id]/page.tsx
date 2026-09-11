import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileView } from "../../../../components/profile/profile-view";
import type { SuggestedUser } from "../../../../components/feed/right-sidebar";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import { getCurrentUser } from "../../../../lib/api/user";
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

  const [currentUser, profileUser, postsRaw, suggestedRaw] = await Promise.all([
    getCurrentUser(cookieHeader),
    apiFetch<UserProfile>(`/users/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
    apiFetch<any>(`/posts?authorId=${id}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
    apiFetch<any>("/users/suggested", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-xl text-center py-20">
        <div className="rounded-xl border border-[#E6E5E0] bg-white p-10 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#EEF4F3] text-[#184A45] mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#17191A]">User not found</h2>
          <p className="mt-2 text-xs text-[#6C6F71]">
            The profile you are looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              href="/feed"
              className="inline-flex items-center rounded-lg bg-[#184A45] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#133D39] transition"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let userPosts: Post[] = [];
  if (Array.isArray(postsRaw)) {
    userPosts = postsRaw;
  } else if (postsRaw && Array.isArray(postsRaw.data)) {
    userPosts = postsRaw.data;
  } else if (postsRaw && Array.isArray(postsRaw.posts)) {
    userPosts = postsRaw.posts;
  }

  let suggestedUsers: SuggestedUser[] = [];
  if (Array.isArray(suggestedRaw)) {
    suggestedUsers = suggestedRaw;
  } else if (suggestedRaw && Array.isArray(suggestedRaw.data)) {
    suggestedUsers = suggestedRaw.data;
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
