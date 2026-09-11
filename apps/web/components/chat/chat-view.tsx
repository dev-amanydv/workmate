"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LeftSidebar } from "../feed/left-sidebar";
import { ConversationsList, type Conversation } from "./conversations-list";
import { ChatWindow } from "./chat-window";
import { connectSocket, disconnectSocket, type ChatMessage } from "../../lib/socket";
import type { Socket } from "socket.io-client";

interface ChatViewProps {
  conversations: Conversation[];
  currentUserId: string;
  userId?: string;
}

export function ChatView({ conversations: initial, currentUserId, userId }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initial);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setActiveConv((prev) => prev ?? initial[0] ?? null);
    }
  }, [initial]);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setIsConnected(true);

    const onNewMessage = (msg: ChatMessage) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== msg.conversationId) return c;
          return {
            ...c,
            updatedAt: msg.createdAt,
            lastMessage: {
              id: msg.id,
              content: msg.content,
              senderId: msg.senderId,
              createdAt: msg.createdAt,
            },
          };
        });
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });
    };

    socket.on("new_message", onNewMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNewMessage);
      disconnectSocket();
    };
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConv(conv);
  };

  const handleFollowStatusChange = useCallback(
    (conversationId: string, canSend: boolean, canReply: boolean) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, canSend, canReply } : c,
        ),
      );
      setActiveConv((prev) =>
        prev?.id === conversationId ? { ...prev, canSend, canReply } : prev,
      );
    },
    [],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_300px_1fr] xl:grid-cols-[240px_320px_1fr] gap-0 items-start h-full overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="hidden lg:block h-full border-r border-[#E6E5E0] bg-[#FBFBFA] px-3 pt-6 overflow-y-auto shrink-0">
        <LeftSidebar userId={userId} />
      </div>

      <div
        className={`${
          activeConv ? "hidden lg:flex" : "flex"
        } flex-col h-full lg:border-r border-[#E6E5E0] bg-white overflow-hidden shrink-0`}
      >
        <ConversationsList
          conversations={conversations}
          activeId={activeConv?.id ?? null}
          currentUserId={currentUserId}
          onSelect={handleSelectConversation}
        />
      </div>

      <div
        className={`${
          activeConv ? "flex" : "hidden lg:flex"
        } flex-col h-full overflow-hidden min-w-0`}
      >
        {!isConnected && (
          <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-[#9E3B27] bg-[#FBF0EE] border-b border-[#EACEC8] flex-shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-[#9E3B27] animate-pulse" />
            Reconnecting to messages...
          </div>
        )}

        {activeConv && socketRef.current ? (
          <ChatWindow
            key={activeConv.id}
            conversation={activeConv}
            currentUserId={currentUserId}
            socket={socketRef.current}
            onFollowStatusChange={handleFollowStatusChange}
            onBack={() => setActiveConv(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8 bg-[#FBFBFA]">
            <div className="h-14 w-14 rounded-xl border border-[#EDECE8] bg-[#F5F4F0] flex items-center justify-center text-[#184A45]">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#17191A]">Your conversations</h3>
              <p className="text-xs sm:text-sm text-[#6C6F71] mt-1 max-w-xs leading-relaxed">
                Select a conversation to start chatting, or connect with peers in the directory to begin a dialogue.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
