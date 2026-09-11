"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  userId?: string;
}

export function BottomNav({ userId }: BottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === "/feed" || pathname === "/";
  const isSearch = pathname === "/search" || pathname.startsWith("/search");
  const isCreate = pathname === "/posts/create" || pathname === "/create";
  const isMessages = pathname === "/chat" || pathname.startsWith("/chat");
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile");

  const navItems = [
    {
      name: "Feed",
      href: "/feed",
      isActive: isHome,
      icon: (active: boolean) => (
        <svg
          className="w-5 h-5 transition-transform duration-150"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 1.75}
          viewBox="0 0 24 24"
        >
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
        </svg>
      ),
    },
    {
      name: "Search",
      href: "/search",
      isActive: isSearch,
      icon: (active: boolean) => (
        <svg
          className="w-5 h-5 transition-transform duration-150"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? 2.3 : 1.75}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      ),
    },
    {
      name: "Create",
      href: "/posts/create",
      isActive: isCreate,
      icon: (active: boolean) => (
        <svg
          className="w-5 h-5 transition-transform duration-150"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 1.75}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      name: "Conversations",
      href: "/chat",
      isActive: isMessages,
      icon: (active: boolean) => (
        <svg
          className="w-5 h-5 transition-transform duration-150"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 1.75}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.502 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: userId ? `/profile/${userId}` : "/profile",
      isActive: isProfile,
      icon: (active: boolean) => (
        <svg
          className="w-5 h-5 transition-transform duration-150"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 1.75}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#E6E5E0] h-16 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
    >
      <div className="grid grid-cols-5 h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                item.isActive
                  ? "text-[#184A45] font-semibold"
                  : "text-[#6C6F71] hover:text-[#17191A] font-medium"
              }`}
              aria-current={item.isActive ? "page" : undefined}
            >
              <div
                className={`p-1 rounded-full transition-transform active:scale-95 ${
                  item.isActive ? "bg-[#EEF4F3]" : ""
                }`}
              >
                {item.icon(item.isActive)}
              </div>
              <span className="text-[10px] tracking-tight truncate max-w-full px-1">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
