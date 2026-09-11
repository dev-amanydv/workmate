"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LeftSidebarProps {
  userId?: string;
}

export function LeftSidebar({ userId }: LeftSidebarProps) {
  const pathname = usePathname();

  const isHome = pathname === "/feed" || pathname === "/";
  const isCreate = pathname === "/posts/create" || pathname === "/create";

  return (
    <aside className="w-full flex flex-col gap-6">
      {/* Navigation List */}
      <nav className="flex flex-col space-y-1">
        {/* Home */}
        <Link
          href="/feed"
          className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
            isHome
              ? "bg-[#EEF2FF] text-[#2563EB]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill={isHome ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isHome ? 0 : 2}
            viewBox="0 0 24 24"
          >
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
          </svg>
          <span>Home</span>
        </Link>

        {/* Search */}
        <Link
          href="/search"
          className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition"
        >
          <svg className="w-5 h-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span>Search</span>
        </Link>

        {/* Messages */}
        <Link
          href="/chat"
          className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition"
        >
          <div className="flex items-center gap-3.5">
            <svg className="w-5 h-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.502 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <span>Messages</span>
          </div>
          {/* Badge: 3 */}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-2xs">
            3
          </span>
        </Link>

        {/* Create Post (replaced Notifications, Network, Bookmarks as requested) */}
        <Link
          href="/posts/create"
          className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
            isCreate
              ? "bg-[#EEF2FF] text-[#2563EB]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Create Post</span>
        </Link>

        {/* Profile */}
        <Link
          href={userId ? `/profile/${userId}` : "/profile"}
          className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition"
        >
          <svg className="w-5 h-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>Profile</span>
        </Link>
      </nav>

      {/* "People. Ideas. Progress." Card */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100/70 bg-gradient-to-b from-[#EBF3FE] via-[#F2F7FE] to-[#E3ECFD] p-6 shadow-xs">
        {/* Workmate Cyan/Blue Icon */}
        <div className="relative z-10 mb-4 h-9 w-9">
          <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
            <circle cx="9" cy="18" r="5" fill="url(#blue_grad_1)" />
            <circle cx="27" cy="18" r="5" fill="url(#blue_grad_2)" />
            <path
              d="M9 18C13 18 14 26 18 26C22 26 23 18 27 18"
              stroke="url(#blue_grad_3)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="blue_grad_1" x1="4" y1="13" x2="14" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00C4FF" />
                <stop offset="1" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="blue_grad_2" x1="22" y1="13" x2="32" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00C4FF" />
                <stop offset="1" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="blue_grad_3" x1="9" y1="18" x2="27" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00C4FF" />
                <stop offset="1" stopColor="#2563EB" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Headings */}
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            People.
            <br />
            Ideas.
            <br />
            Progress.
          </h2>
          <p className="pt-2 text-xs font-medium text-slate-500 leading-relaxed">
            A more human
            <br />
            professional network.
          </p>
        </div>

        {/* Invite friends Button */}
        <div className="relative z-10 mt-6">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition cursor-pointer"
          >
            <span>Invite friends</span>
            <span className="text-sm leading-none">→</span>
          </button>
        </div>

        {/* Soft decorative wavy organic graphics in bottom background */}
        <div className="absolute -bottom-6 -right-6 w-36 h-36 rounded-full bg-gradient-to-tr from-blue-300/30 via-indigo-300/20 to-transparent blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-200/40 via-blue-200/20 to-transparent blur-lg pointer-events-none" />
      </div>
    </aside>
  );
}
