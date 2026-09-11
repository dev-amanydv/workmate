import { headers } from "next/headers";
import { ChatView } from "../../../components/chat/chat-view";
import { apiFetch } from "../../../lib/api/client";
import type { Conversation } from "../../../components/chat/conversations-list";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

import { getCurrentUser } from "../../../lib/api/user";

export default async function ChatPage() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  const [user, convRaw] = await Promise.all([
    getCurrentUser(cookieHeader),
    apiFetch<Conversation[]>("/chat/conversations", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => []),
  ]);

  const conversations = Array.isArray(convRaw) ? convRaw : [];

  return (
    <ChatView
      conversations={conversations}
      currentUserId={user?.id ?? ""}
      userId={user?.id}
    />
  );
}
