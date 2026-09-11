"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LeftSidebarProps {
  userId?: string;
}

export function LeftSidebar({ userId }: LeftSidebarProps) {
  const pathname = usePathname();
  const [copiedInvite, setCopiedInvite] = useState(false);

  const isHome = pathname === "/feed" || pathname === "/";
  const isSearch = pathname === "/search" || pathname.startsWith("/search");
  const isCreate = pathname === "/posts/create" || pathname === "/create";
  const isMessages = pathname === "/chat" || pathname.startsWith("/chat/");
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile/");

  const handleCopyInvite = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(`${window.location.origin}/login`);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2200);
    }
  };

  return (
    <aside className="w-full flex flex-col gap-6">
      {/* Navigation List */}
      <nav className="flex flex-col space-y-1">
        {/* Home */}
        <Link
          href="/feed"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
            isHome
              ? "bg-[#EFEFEA] text-[#184A45] font-semibold"
              : "text-[#484B4D] hover:text-[#17191A] hover:bg-[#F5F4F0]"
          }`}
        >
          <svg
            className="w-4.5 h-4.5 shrink-0"
            fill={isHome ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isHome ? 0 : 1.75}
            viewBox="0 0 24 24"
          >
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
          </svg>
          <span>Feed</span>
        </Link>

        {/* Directory / Search */}
        <Link
          href="/search"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
            isSearch
              ? "bg-[#EFEFEA] text-[#184A45] font-semibold"
              : "text-[#484B4D] hover:text-[#17191A] hover:bg-[#F5F4F0]"
          }`}
        >
          <svg
            className="w-4.5 h-4.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={isSearch ? 2.2 : 1.75}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span>Directory</span>
        </Link>

        {/* Conversations / Messages */}
        <Link
          href="/chat"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
            isMessages
              ? "bg-[#EFEFEA] text-[#184A45] font-semibold"
              : "text-[#484B4D] hover:text-[#17191A] hover:bg-[#F5F4F0]"
          }`}
        >
          <svg
            className="w-4.5 h-4.5 shrink-0"
            fill={isMessages ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isMessages ? 0 : 1.75}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.502 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <span>Conversations</span>
        </Link>

        {/* Create Post */}
        <Link
          href="/posts/create"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
            isCreate
              ? "bg-[#EFEFEA] text-[#184A45] font-semibold"
              : "text-[#484B4D] hover:text-[#17191A] hover:bg-[#F5F4F0]"
          }`}
        >
          <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Create</span>
        </Link>

        {/* Profile */}
        <Link
          href={userId ? `/profile/${userId}` : "/profile"}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
            isProfile
              ? "bg-[#EFEFEA] text-[#184A45] font-semibold"
              : "text-[#484B4D] hover:text-[#17191A] hover:bg-[#F5F4F0]"
          }`}
        >
          <svg
            className="w-4.5 h-4.5 shrink-0"
            fill={isProfile ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isProfile ? 0 : 1.75}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Network Community Utility Card */}
      <div className="rounded-xl border border-[#E6E5E0] bg-[#F5F4F0] p-4.5 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#184A45]" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6C6F71]">
              Colleague Invite
            </p>
          </div>
          <h3 className="text-sm font-semibold text-[#17191A] leading-snug">
            Invite Colleagues
          </h3>
          <p className="text-xs text-[#6C6F71] leading-relaxed">
            Connect and share work with colleagues. Invite teammates and people whose work you respect.
          </p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="w-full rounded-lg bg-[#184A45] hover:bg-[#133D39] text-white px-3.5 py-2 text-xs font-semibold transition cursor-pointer text-center"
          >
            {copiedInvite ? "Invite link copied" : "Invite colleagues"}
          </button>
        </div>
      </div>
    </aside>
  );
}
