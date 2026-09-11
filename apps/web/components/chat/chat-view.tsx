"use client";

import { useState, useEffect, useRef } from "react";
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
  const [activeConv, setActiveConv] = useState<Conversation | null>(
    initial[0] ?? null, // auto-open most recent
  );
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Connect socket once on mount
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setIsConnected(true);

    // Bubble new messages up to update conversations list last message preview
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
        // Re-sort by updatedAt desc
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_300px_1fr] xl:grid-cols-[240px_320px_1fr] gap-0 items-start min-h-[calc(100vh-64px)] -mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Column 1: Left navigation sidebar */}
      <div className="hidden lg:block h-full border-r border-slate-100 bg-white px-3 pt-6">
        <LeftSidebar userId={userId} />
      </div>

      {/* Column 2: Conversations list */}
      <div className="hidden lg:flex flex-col h-full border-r border-slate-100 bg-white overflow-hidden">
        <ConversationsList
          conversations={conversations}
          activeId={activeConv?.id ?? null}
          currentUserId={currentUserId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Column 3: Active chat window */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Connection status banner */}
        {!isConnected && (
          <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-amber-700 bg-amber-50 border-b border-amber-100 flex-shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Reconnecting...
          </div>
        )}

        {activeConv && socketRef.current ? (
          <ChatWindow
            key={activeConv.id}
            conversation={activeConv}
            currentUserId={currentUserId}
            socket={socketRef.current}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-[#F8FAFC]">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Your messages</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Select a conversation to start chatting, or send a message from someone&apos;s profile
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
