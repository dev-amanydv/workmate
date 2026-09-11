"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "../ui/avatar";
import { WorkmateLogo } from "../brand/logo";
import { getApiBaseUrl } from "../../lib/api/client";

interface FeedHeaderProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string | null;
}

export function FeedHeader({
  userName,
  userEmail,
  userAvatar,
}: FeedHeaderProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayName = userName || "Aman Yadav";
  const displayEmail =
    userEmail ||
    (userName
      ? `${userName.trim().toLowerCase().replace(/\s+/g, ".")}@gmail.com`
      : "aman.yadav@gmail.com");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if network call fails, redirect to login
    } finally {
      window.location.href = "/login";
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
            className="p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#F5F4F0] rounded-xl transition"
            aria-label="Messages"
            title="Conversations"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              <circle cx="8" cy="12" r="0.75" fill="currentColor" strokeWidth={0} />
              <circle cx="12" cy="12" r="0.75" fill="currentColor" strokeWidth={0} />
              <circle cx="16" cy="12" r="0.75" fill="currentColor" strokeWidth={0} />
            </svg>
          </Link>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#F5F4F0] rounded-xl transition cursor-pointer"
            aria-label="Notifications"
            title="Activity"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E04D36]" />
          </button>

          {/* User Profile Affordance & Dropdown Menu */}
          <div className="relative pl-1">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-3 py-1.5 px-3 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition focus:outline-none cursor-pointer"
              aria-expanded={showProfileMenu}
              aria-label="Account menu"
            >
              <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                <Avatar
                  src={userAvatar}
                  alt={displayName}
                  size={36}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="hidden sm:inline text-[15px] font-medium text-[#111827] max-w-[130px] truncate">
                {displayName}
              </span>
              <svg
                className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Redesigned Popup Dropdown */}
            {showProfileMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-[310px] rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_36px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Header Profile Section */}
                <div className="p-5 flex items-center gap-4">
                  <div className="relative h-[50px] w-[50px] rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <Avatar
                      src={userAvatar}
                      alt={displayName}
                      size={50}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-[17px] font-semibold text-[#0F172A] truncate leading-snug">
                      {displayName}
                    </span>
                    <span className="text-[14px] text-[#64748B] truncate font-normal leading-snug">
                      {displayEmail}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#F1F3F5]" />

                {/* Middle Menu Items */}
                <div className="py-2 flex flex-col">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-4 px-6 py-3.5 text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5 text-[#334155] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="text-[15px] font-medium">View Profile</span>
                  </Link>

                  <Link
                    href="/posts/create"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-4 px-6 py-3.5 text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5 text-[#334155] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="4" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                    <span className="text-[15px] font-medium">Create Post</span>
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-[#F1F3F5]" />

                {/* Sign Out Section */}
                <div className="py-2 flex flex-col">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-4 px-6 py-3.5 text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left w-full disabled:opacity-50"
                  >
                    <svg
                      className="w-5 h-5 text-[#475569] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    <span className="text-[15px] font-medium">
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
