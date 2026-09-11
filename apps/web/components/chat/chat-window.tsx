"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import type { Socket } from "socket.io-client";
import { ChatBubble } from "./chat-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { ChatMessage } from "../../lib/socket";
import type { Conversation } from "./conversations-list";
import { apiFetch } from "../../lib/api/client";

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  socket: Socket;
}

const TYPING_TIMEOUT_MS = 2000;

export function ChatWindow({ conversation, currentUserId, socket }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const convIdRef = useRef(conversation.id);

  const other = conversation.otherUser;

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Check if user is near bottom (within 150px)
  const isNearBottom = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  // Fetch initial messages for this conversation
  useEffect(() => {
    convIdRef.current = conversation.id;
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setTypingUsers(new Map());
    setIsLoading(true);

    // Join socket room
    socket.emit("join_conversation", { conversationId: conversation.id });

    // Load history
    apiFetch<{ messages: ChatMessage[]; nextCursor: string | null; hasMore: boolean }>(
      `/chat/conversations/${conversation.id}/messages`,
    )
      .then((data) => {
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setTimeout(() => scrollToBottom("instant"), 50);
      })
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));

    return () => {
      socket.emit("leave_conversation", { conversationId: conversation.id });
      // Clear typing timer
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [conversation.id, socket, scrollToBottom]);

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.conversationId !== convIdRef.current) return;
      setMessages((prev) => {
        // Deduplicate (optimistic + confirmed)
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Auto-scroll only if near bottom
      if (isNearBottom()) {
        setTimeout(() => scrollToBottom(), 50);
      }
    };

    const handleTyping = (payload: {
      conversationId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      if (payload.conversationId !== convIdRef.current) return;
      if (payload.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (payload.isTyping) {
          next.set(payload.userId, payload.userName);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });

      if (payload.isTyping && isNearBottom()) {
        setTimeout(() => scrollToBottom(), 50);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [socket, currentUserId, isNearBottom, scrollToBottom]);

  // Load older messages (scroll to top)
  const loadMore = async () => {
    if (!hasMore || isFetchingMore || !nextCursor) return;
    setIsFetchingMore(true);
    const el = messagesRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;

    try {
      const data = await apiFetch<{
        messages: ChatMessage[];
        nextCursor: string | null;
        hasMore: boolean;
      }>(`/chat/conversations/${conversation.id}/messages?cursor=${nextCursor}`);

      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);

      // Maintain scroll position
      requestAnimationFrame(() => {
        if (el) {
          el.scrollTop = el.scrollHeight - prevScrollHeight;
        }
      });
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Typing indicator: debounced stop
  const emitTyping = useCallback(
    (typing: boolean) => {
      socket.emit(typing ? "typing_start" : "typing_stop", {
        conversationId: convIdRef.current,
      });
    },
    [socket],
  );

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!isTypingRef.current && value.trim()) {
      isTypingRef.current = true;
      emitTyping(true);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    if (value.trim()) {
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        emitTyping(false);
      }, TYPING_TIMEOUT_MS);
    } else {
      isTypingRef.current = false;
      emitTyping(false);
    }
  };

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || isSending) return;

    // Stop typing
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    emitTyping(false);

    setIsSending(true);
    setInput("");

    socket.emit(
      "send_message",
      { conversationId: convIdRef.current, content },
      () => setIsSending(false),
    );
    // Optimistic scroll
    setTimeout(() => scrollToBottom(), 50);
  }, [input, isSending, socket, emitTyping, scrollToBottom]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const typingList = Array.from(typingUsers.values());

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-slate-100 shadow-xs flex-shrink-0">
        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-slate-200 bg-blue-50 flex items-center justify-center shadow-xs">
          {other?.avatarUrl ? (
            <Image
              src={other.avatarUrl}
              alt={other.name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              unoptimized={other.avatarUrl.startsWith("http")}
            />
          ) : (
            <span className="text-sm font-bold text-blue-600">
              {other?.name.charAt(0).toUpperCase() ?? "?"}
            </span>
          )}
          <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{other?.name ?? "Unknown"}</p>
          <p className="text-xs text-emerald-500 font-medium">Online</p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0"
        onScroll={() => {
          const el = messagesRef.current;
          if (el && el.scrollTop < 80 && hasMore && !isFetchingMore) {
            void loadMore();
          }
        }}
      >
        {/* Load more */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={isFetchingMore}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium disabled:opacity-50 transition"
            >
              {isFetchingMore ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3 py-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                {i % 2 !== 0 && <div className="h-7 w-7 rounded-full bg-slate-200 animate-pulse" />}
                <div
                  className="h-10 rounded-2xl bg-slate-200 animate-pulse"
                  style={{ width: `${120 + i * 30}px` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
            <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Say hello to {other?.name ?? "them"}!</p>
            <p className="text-xs text-slate-400">Your messages are end-to-end private</p>
          </div>
        )}

        {/* Messages */}
        {!isLoading &&
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showAvatar = !prev || prev.senderId !== msg.senderId;
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderId === currentUserId}
                showAvatar={showAvatar}
              />
            );
          })}

        {/* Typing indicators */}
        {typingList.map((name) => (
          <TypingIndicator key={name} userName={name} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 px-4 py-3 bg-white border-t border-slate-100"
      >
        <div className="flex items-end gap-2 bg-[#F1F5F9] rounded-2xl px-4 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all shadow-xs">
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${other?.name ?? ""}...`}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1 max-h-32 leading-relaxed"
            style={{ overflowY: input.includes("\n") ? "auto" : "hidden" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
            style={{
              background: input.trim() && !isSending
                ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                : "#e2e8f0",
            }}
          >
            {isSending ? (
              <div className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
            ) : (
              <svg
                className={`w-4 h-4 transition-colors ${input.trim() ? "text-white" : "text-slate-400"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 pl-1">
          Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
