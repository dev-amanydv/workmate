import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreatePostView } from "../../../../components/posts/create-post-view";
import type { SuggestedUser } from "../../../../components/feed/right-sidebar";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import type { UserProfile } from "../../../../types/user";

export const metadata: Metadata = {
  title: "Create a Post | Workmate",
  description: "Share an update, idea, or question with your network.",
};

export default async function CreatePostPage() {
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
    currentUser = null;
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
    <CreatePostView
      currentUser={currentUser}
      suggestedUsers={suggestedUsers}
    />
  );
}
