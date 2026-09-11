"use client";

import { Avatar } from "@/components/ui/avatar";
import type { ChatMessage } from "../../lib/socket";

interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showAvatar?: boolean;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ message, isMine, showAvatar = true }: ChatBubbleProps) {
  if (isMine) {
    return (
      <div className="flex justify-end items-end gap-2 px-1 group animate-in fade-in slide-in-from-bottom-1 duration-200">
        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1">
          {formatTime(message.createdAt)}
        </span>
        <div className="max-w-[70%]">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed shadow-sm"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            }}
          >
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 px-1 group animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex-shrink-0">
        {showAvatar ? (
          <Avatar
            src={message.sender.avatarUrl}
            alt={message.sender.name}
            fallbackName={message.sender.name}
            size={28}
            rounded="full"
            className="h-7 w-7 border border-slate-200"
          />
        ) : (
          <div className="h-7 w-7" />
        )}
      </div>
      <div className="max-w-[70%] flex flex-col gap-1">
        {showAvatar && (
          <span className="text-[10px] text-slate-400 pl-1">{message.sender.name}</span>
        )}
        <div className="flex items-end gap-2">
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border border-slate-100 text-sm text-slate-800 leading-relaxed shadow-sm">
            {message.content}
          </div>
          <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
