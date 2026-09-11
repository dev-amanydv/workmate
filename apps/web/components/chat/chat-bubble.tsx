"use client";

import { Avatar } from "../ui/avatar";
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
        <span className="text-[11px] text-[#8A8D90] opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1 tabular-nums">
          {formatTime(message.createdAt)}
        </span>
        <div className="max-w-[70%]">
          <div className="px-4 py-2.5 rounded-2xl rounded-br-xs text-sm text-white bg-[#505050] leading-relaxed shadow-xs break-words">
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
            className="h-7 w-7 rounded-md border border-[#E6E5E0] shrink-0"
          />
        ) : (
          <div className="h-7 w-7" />
        )}
      </div>
      <div className="max-w-[70%] flex flex-col gap-1">
        {showAvatar && (
          <span className="text-[11px] font-medium text-[#6C6F71] pl-1">{message.sender.name}</span>
        )}
        <div className="flex items-end gap-2">
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-xs bg-white border border-[#E6E5E0] text-sm text-[#17191A] leading-relaxed shadow-xs break-words">
            {message.content}
          </div>
          <span className="text-[11px] text-[#8A8D90] opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1 tabular-nums">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
