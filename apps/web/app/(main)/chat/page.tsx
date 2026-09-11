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

export default async function ChatPage() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let user: UserProfile | null = null;
  let conversations: Conversation[] = [];

  try {
    user = await apiFetch<UserProfile>("/users/me", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    user = null;
  }

  if (user) {
    try {
      const res = await apiFetch<Conversation[]>("/chat/conversations", {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      });
      conversations = Array.isArray(res) ? res : [];
    } catch {
      conversations = [];
    }
  }

  return (
    <ChatView
      conversations={conversations}
      currentUserId={user?.id ?? ""}
      userId={user?.id}
    />
  );
}
