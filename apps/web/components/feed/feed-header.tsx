"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "../ui/avatar";
import { WorkmateLogo } from "../brand/logo";
import { LogoutButton } from "../logout-button";

interface FeedHeaderProps {
  userName?: string;
  userAvatar?: string | null;
}

export function FeedHeader({
  userName,
  userAvatar,
}: FeedHeaderProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageError, setImageError] = useState(false);

  const displayName = userName || "Account";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <header className="shrink-0 sticky top-0 z-50 border-b border-[#E6E5E0] bg-white">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-8 h-15">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-8">
          <Link
            href="/feed"
            className="flex items-center transition opacity-100 hover:opacity-85 focus:outline-none"
            aria-label="Workmate Home"
          >
            <WorkmateLogo size="md" />
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-lg mx-6 hidden md:block">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <button
              type="submit"
              className="absolute left-3.5 text-[#6C6F71] hover:text-[#17191A] transition"
              aria-label="Submit search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people by name, role, or company..."
              className="w-full bg-[#F5F4F0] hover:bg-[#EFEFEA] focus:bg-white text-sm text-[#17191A] placeholder-[#8A8D90] rounded-lg pl-10 pr-14 py-2 border border-transparent focus:border-[#184A45] focus:outline-none transition"
            />
            <div className="absolute right-3 flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[#E6E5E0] bg-white text-[11px] font-mono text-[#8A8D90] pointer-events-none">
              <span className="text-xs leading-none">⌘</span>
              <span>K</span>
            </div>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search */}
          <Link
            href="/search"
            className="md:hidden p-2 text-[#6C6F71] hover:text-[#17191A] hover:bg-[#F5F4F0] rounded-lg transition"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </Link>

          {/* Direct Messages */}
          <Link
            href="/chat"
            className="p-2 text-[#6C6F71] hover:text-[#17191A] hover:bg-[#F5F4F0] rounded-lg transition"
            aria-label="Messages"
            title="Conversations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </Link>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-[#6C6F71] hover:text-[#17191A] hover:bg-[#F5F4F0] rounded-lg transition cursor-pointer"
            aria-label="Notifications"
            title="Activity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#9E3B27]" />
          </button>

          {/* User Profile Affordance (Replacing unstyled floating initial) */}
          <div className="relative pl-1">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2.5 py-1 px-2 rounded-lg border border-[#E6E5E0] hover:border-[#D5D3CC] bg-[#FBFBFA] hover:bg-[#F5F4F0] transition focus:outline-none focus:border-[#184A45] cursor-pointer"
              aria-expanded={showProfileMenu}
              aria-label="Account menu"
            >
              <div className="relative h-7 w-7 rounded overflow-hidden border border-[#E6E5E0] bg-[#EEF4F3] flex items-center justify-center shrink-0">
                <Avatar
                  src={userAvatar}
                  alt={displayName}
                  size={28}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="hidden sm:inline text-xs font-medium text-[#17191A] max-w-[100px] truncate">
                {displayName}
              </span>
              <svg
                className={`w-3 h-3 text-[#6C6F71] transition-transform duration-150 ${showProfileMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown Menu - Reserved elevation */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E6E5E0] bg-white py-1.5 shadow-lg ring-1 ring-black/5 z-50">
                <div className="px-3.5 py-2 border-b border-[#E6E5E0]">
                  <p className="text-xs font-semibold text-[#17191A]">{displayName}</p>
                  <p className="text-[11px] text-[#6C6F71]">Signed in as user</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3.5 py-2 text-xs font-medium text-[#17191A] hover:bg-[#F5F4F0] transition"
                >
                  View Profile
                </Link>
                <Link
                  href="/posts/create"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-3.5 py-2 text-xs font-medium text-[#17191A] hover:bg-[#F5F4F0] transition"
                >
                  Create Post
                </Link>
                <div className="border-t border-[#E6E5E0] my-1 pt-1 px-1">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
