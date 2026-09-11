"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Avatar } from "../ui/avatar";
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
  /** Called when the user successfully follows the other person */
  onFollowStatusChange?: (conversationId: string, canSend: boolean, canReply: boolean) => void;
}

const TYPING_TIMEOUT_MS = 2000;

export function ChatWindow({
  conversation,
  currentUserId,
  socket,
  onFollowStatusChange,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
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
  // canSend: current user follows other → can send messages
  // canReply: both follow each other → full messaging
  // If user is the receiver (doesn't follow other but other follows them),
  // they can only read and see a "follow to reply" banner
  const canSend = conversation.canSend;
  const canReply = conversation.canReply;

  // If current user didn't initiate (they're receiver who hasn't followed back),
  // show read-only mode with follow CTA
  const isReadOnly = !canSend && !canReply;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const isNearBottom = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  // Load messages + join room
  useEffect(() => {
    convIdRef.current = conversation.id;
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setTypingUsers(new Map());
    setIsLoading(true);

    socket.emit("join_conversation", { conversationId: conversation.id });

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
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [conversation.id, socket, scrollToBottom]);

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.conversationId !== convIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (isNearBottom()) setTimeout(() => scrollToBottom(), 50);
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
        if (payload.isTyping) next.set(payload.userId, payload.userName);
        else next.delete(payload.userId);
        return next;
      });
      if (payload.isTyping && isNearBottom()) setTimeout(() => scrollToBottom(), 50);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [socket, currentUserId, isNearBottom, scrollToBottom]);

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
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight;
      });
    } finally {
      setIsFetchingMore(false);
    }
  };

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
    if (!content || isSending || isReadOnly) return;
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
    setTimeout(() => scrollToBottom(), 50);
  }, [input, isSending, isReadOnly, socket, emitTyping, scrollToBottom]);

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

  // Follow the other user
  const handleFollow = async () => {
    if (!other || isFollowing) return;
    setIsFollowing(true);
    try {
      await apiFetch(`/follows/${other.id}`, { method: "POST" });
      // Refetch follow status and notify parent to update conversation
      const status = await apiFetch<{ senderFollowsReceiver: boolean; receiverFollowsSender: boolean }>(
        `/chat/follow-status/${other.id}`,
      );
      onFollowStatusChange?.(
        conversation.id,
        status.senderFollowsReceiver,
        status.senderFollowsReceiver && status.receiverFollowsSender,
      );
    } catch {
      // ignore
    } finally {
      setIsFollowing(false);
    }
  };

  const typingList = Array.from(typingUsers.values());

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-slate-100 shadow-xs flex-shrink-0">
        <div className="relative">
          <Avatar
            src={other?.avatarUrl}
            alt={other?.name || "User"}
            fallbackName={other?.name}
            size={40}
            rounded="full"
            className="h-10 w-10 border border-slate-200"
          />
          <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{other?.name ?? "Unknown"}</p>
          <p className="text-xs text-emerald-500 font-medium">Online</p>
        </div>
        {/* Follow status badge */}
        {isReadOnly && (
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            Read-only
          </span>
        )}
        {!isReadOnly && !canReply && (
          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
            Awaiting follow-back
          </span>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0"
        onScroll={() => {
          const el = messagesRef.current;
          if (el && el.scrollTop < 80 && hasMore && !isFetchingMore) void loadMore();
        }}
      >
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

        {/* Skeleton */}
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
            <p className="text-sm font-medium text-slate-500">
              {canSend ? `Say hello to ${other?.name ?? "them"}!` : `${other?.name ?? "Someone"} sent you a message`}
            </p>
            <p className="text-xs text-slate-400">
              {isReadOnly ? "Follow them back to reply" : "Your messages are private"}
            </p>
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

      {/* Bottom area: input OR follow CTA */}
      {isReadOnly ? (
        /* Follow-to-reply banner */
        <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-slate-100">
          <div className="flex flex-col items-center gap-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-xs text-slate-600 font-medium">
                Follow{" "}
                <span className="font-semibold text-slate-800">{other?.name}</span>{" "}
                to reply to their messages
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleFollow()}
              disabled={isFollowing}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              }}
            >
              {isFollowing ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                  Following...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Follow {other?.name}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Regular message input */
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
                background:
                  input.trim() && !isSending
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
      )}
    </div>
  );
}
