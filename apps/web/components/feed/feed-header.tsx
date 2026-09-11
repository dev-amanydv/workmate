"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "../logout-button";

interface FeedHeaderProps {
  userName?: string;
  userAvatar?: string;
}

export function FeedHeader({
  userName = "Aman",
  userAvatar = "/mock/avatar-aman.jpg",
}: FeedHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link href="/feed" className="flex items-center gap-2.5 transition hover:opacity-90">
            <Image
              src="/mock/workmate-logo.png"
              alt="Workmate"
              width={122}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-lg mx-6 hidden md:block">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for people, posts, or topics..."
              className="w-full bg-[#F1F5F9]/80 hover:bg-[#E2E8F0]/60 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-10 pr-14 py-2 border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            />
            <div className="absolute right-3 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-400 shadow-2xs pointer-events-none">
              <span className="text-xs leading-none">⌘</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Sun / Theme toggle icon */}
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
            aria-label="Toggle theme"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* Red unread dot */}
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Messages */}
          <Link
            href="/chat"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
            aria-label="Messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.123-.62.338-1.578.583-2.42A7.886 7.886 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </Link>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-slate-200 transition focus:outline-none"
              aria-expanded={showProfileMenu}
            >
              <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-200 shadow-2xs">
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <svg
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white py-2 shadow-xl ring-1 ring-black/5 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{userName}</p>
                  <p className="text-xs text-slate-400">Signed in</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  View Profile
                </Link>
                <Link
                  href="/posts/create"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Create Post
                </Link>
                <div className="border-t border-slate-100 my-1 pt-1 px-2">
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
