import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreatePostView } from "../../../../components/posts/create-post-view";
import type { SuggestedUser } from "../../../../components/feed/right-sidebar";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import { getCurrentUser } from "../../../../lib/api/user";
import type { UserProfile } from "../../../../types/user";

export const metadata: Metadata = {
  title: "Create a Post | Workmate",
  description: "Share an update, idea, or question with your network.",
};

export default async function CreatePostPage() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  const [currentUser, suggestedRaw] = await Promise.all([
    getCurrentUser(cookieHeader),
    apiFetch<any>("/users/suggested", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  let suggestedUsers: SuggestedUser[] = [];
  if (Array.isArray(suggestedRaw)) {
    suggestedUsers = suggestedRaw;
  } else if (suggestedRaw && Array.isArray(suggestedRaw.data)) {
    suggestedUsers = suggestedRaw.data;
  }

  return (
    <CreatePostView
      currentUser={currentUser}
      suggestedUsers={suggestedUsers}
    />
  );
}
