import type { Metadata } from "next";
import { headers } from "next/headers";
import { FeedHeader } from "../../components/feed/feed-header";
import { BottomNav } from "../../components/layout/bottom-nav";
import { apiFetch } from "../../lib/api/client";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

import { getCurrentUser } from "../../lib/api/user";

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

  const user = await getCurrentUser(cookieHeader);

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-[#FBFBFA] text-[#17191A] antialiased overflow-hidden">
      <FeedHeader
        userName={user?.name}
        userEmail={user?.email}
        userAvatar={user?.avatarUrl}
      />
      <main className="flex-1 min-h-0 overflow-hidden mx-auto max-w-[1380px] w-full px-4 sm:px-6 lg:px-8 pt-15 lg:pt-0 pb-16 lg:pb-0">
        {children}
      </main>
      <BottomNav userId={user?.id} />
    </div>
  );
}

