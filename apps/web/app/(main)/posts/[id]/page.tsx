import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeftSidebar } from "../../../../components/feed/left-sidebar";
import { RightSidebar, type SuggestedUser } from "../../../../components/feed/right-sidebar";
import { PostDetailView } from "../../../../components/posts/post-detail-view";
import { ApiError, apiFetch } from "../../../../lib/api/client";
import type { Post } from "../../../../types/post";
import type { UserProfile } from "../../../../types/user";

export const metadata: Metadata = {
  title: "Post | Workmate",
  description: "View post details on Workmate.",
};

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

  let suggestedUsers: SuggestedUser[] = [];
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

  if (!post) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start h-full overflow-hidden">
        {/* Left Sidebar: Fixed navigation column */}
        <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pr-1 shrink-0">
          <LeftSidebar userId={user.id} />
        </div>

        {/* Center Column */}
        <div className="h-full overflow-y-auto no-scrollbar py-6 px-1 min-w-0 pb-12">
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-8 text-center">
            <h2 className="text-lg font-bold text-[#17191A]">
              Post not found
            </h2>
            <p className="mt-2 text-xs text-[#6C6F71]">
              This post may have been deleted or is no longer available.
            </p>
            <div className="mt-6">
              <Link
                href="/feed"
                className="inline-flex items-center rounded-lg bg-[#184A45] px-4 py-2 text-xs font-semibold text-white hover:bg-[#133D39] transition"
              >
                Back to Feed
              </Link>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Fixed suggested follows column */}
        <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pl-1 shrink-0">
          <RightSidebar userName={user.name} suggestedUsers={suggestedUsers} />
        </div>
      </div>
    );
  }

  return (
    <PostDetailView
      initialPost={post}
      currentUserId={user.id}
      currentUser={user}
      suggestedUsers={suggestedUsers}
    />
  );
}

