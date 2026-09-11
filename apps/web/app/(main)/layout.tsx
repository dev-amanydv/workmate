import type { Metadata } from "next";
import { headers } from "next/headers";
import { FeedHeader } from "../../components/feed/feed-header";
import { apiFetch } from "../../lib/api/client";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export const metadata: Metadata = {
  title: "Workmate",
  description: "A more human professional network",
};

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let user: UserProfile | null = null;
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

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#17191A] antialiased">
      <FeedHeader
        userName={user?.name}
        userAvatar={user?.avatarUrl}
      />
      <main className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

