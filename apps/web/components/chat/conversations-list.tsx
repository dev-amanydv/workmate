"use client";

import { Avatar } from "@/components/ui/avatar";

export interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  /** Current user follows the other person (can initiate/send) */
  canSend: boolean;
  /** Both follow each other (full bidirectional messaging) */
  canReply: boolean;
}

interface ConversationsListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (conv: Conversation) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationsList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
}: ConversationsListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Messages</h2>
        <p className="text-xs text-slate-400 mt-0.5">{conversations.length} conversations</p>
      </div>

      {/* Conversation rows */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-16">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.502 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">No conversations yet</p>
            <p className="text-xs text-slate-400">Start a conversation from someone&apos;s profile</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const other = conv.otherUser;
            const lastMsg = conv.lastMessage;
            const isMyMessage = lastMsg?.senderId === currentUserId;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 cursor-pointer ${
                  isActive ? "bg-blue-50/70 border-r-2 border-blue-500" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={other?.avatarUrl}
                    alt={other?.name || "User"}
                    fallbackName={other?.name}
                    size={44}
                    rounded="full"
                    className="h-11 w-11 border border-slate-200"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={`text-sm font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-900"}`}>
                      {other?.name ?? "Unknown"}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {timeAgo(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {lastMsg
                      ? `${isMyMessage ? "You: " : ""}${lastMsg.content}`
                      : "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
