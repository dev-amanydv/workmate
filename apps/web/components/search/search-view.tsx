"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "../feed/left-sidebar";
import { RightSidebar, type SuggestedUser } from "../feed/right-sidebar";
import { UserListItem } from "./user-list-item";
import { AppleSpinner } from "./apple-spinner";
import { apiFetch } from "../../lib/api/client";
import type { UserProfile } from "../../types/user";

interface SearchViewProps {
  currentUser?: UserProfile | null;
  initialQuery?: string;
  initialRecentUsers?: UserProfile[];
  initialSearchResults?: UserProfile[];
  suggestedUsers?: SuggestedUser[];
  isLoadingInitialRecent?: boolean;
}

const DEFAULT_USERS: Array<UserProfile & { mutualCount: number; mutualAvatars: string[] }> = [
  {
    id: "rohan-mehta",
    name: "Rohan Mehta",
    email: "rohan@workmate.internal",
    bio: "Software Engineer at Stripe",
    avatarUrl: "/mock/avatar-rohan.jpg",
    createdAt: new Date().toISOString(),
    followersCount: 12,
    followingCount: 45,
    postsCount: 6,
    isFollowing: false,
    isSelf: false,
    mutualCount: 12,
    mutualAvatars: ["/mock/avatar-priya.jpg", "/mock/avatar-arjun.jpg", "/mock/avatar-sneha.jpg"],
  },
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    email: "priya@workmate.internal",
    bio: "Product Designer at Figma",
    avatarUrl: "/mock/avatar-priya.jpg",
    createdAt: new Date().toISOString(),
    followersCount: 8,
    followingCount: 38,
    postsCount: 9,
    isFollowing: false,
    isSelf: false,
    mutualCount: 8,
    mutualAvatars: ["/mock/avatar-rohan.jpg", "/mock/avatar-sneha.jpg", "/mock/avatar-neha.jpg"],
  },
  {
    id: "arjun-nair",
    name: "Arjun Nair",
    email: "arjun@workmate.internal",
    bio: "Backend Engineer at Zepto",
    avatarUrl: "/mock/avatar-arjun.jpg",
    createdAt: new Date().toISOString(),
    followersCount: 5,
    followingCount: 22,
    postsCount: 3,
    isFollowing: false,
    isSelf: false,
    mutualCount: 5,
    mutualAvatars: ["/mock/avatar-rohan.jpg", "/mock/avatar-priya.jpg", "/mock/avatar-aman.jpg"],
  },
  {
    id: "sneha-kapoor",
    name: "Sneha Kapoor",
    email: "sneha@workmate.internal",
    bio: "Building at Workmate",
    avatarUrl: "/mock/avatar-sneha.jpg",
    createdAt: new Date().toISOString(),
    followersCount: 18,
    followingCount: 64,
    postsCount: 14,
    isFollowing: false,
    isSelf: false,
    mutualCount: 18,
    mutualAvatars: ["/mock/avatar-priya.jpg", "/mock/avatar-arjun.jpg", "/mock/avatar-neha.jpg"],
  },
];

export function SearchView({
  currentUser,
  initialQuery = "",
  initialRecentUsers = [],
  initialSearchResults = [],
  suggestedUsers = [],
  isLoadingInitialRecent = false,
}: SearchViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<UserProfile[]>(initialSearchResults);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(isLoadingInitialRecent);
  const [activeTab, setActiveTab] = useState<"people" | "posts" | "companies" | "hashtags">("people");
  const [showAll, setShowAll] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Combine real recent users with default members if database has fewer than 4 users
  const recentDisplayUsers = useMemo(() => {
    const combined = [...initialRecentUsers];
    const seenIds = new Set(combined.map((u) => u.id));

    DEFAULT_USERS.forEach((defUser) => {
      if (!seenIds.has(defUser.id)) {
        combined.push(defUser);
        seenIds.add(defUser.id);
      }
    });

    return combined;
  }, [initialRecentUsers]);

  // Execute Search API call
  const executeSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      startTransition(() => {
        router.replace("/search");
      });
      return;
    }

    setIsSearching(true);
    startTransition(() => {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
    });

    try {
      const res = await apiFetch<any>(`/users/search?q=${encodeURIComponent(trimmed)}`);
      let results: UserProfile[] = [];
      if (Array.isArray(res)) {
        results = res;
      } else if (res && Array.isArray(res.data)) {
        results = res.data;
      }

      // If backend returns matching users, show them; also check default users for demo
      const lower = trimmed.toLowerCase();
      const demoMatches = DEFAULT_USERS.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          (u.bio && u.bio.toLowerCase().includes(lower)),
      );

      const seen = new Set(results.map((r) => r.id));
      demoMatches.forEach((m) => {
        if (!seen.has(m.id)) {
          results.push(m);
          seen.add(m.id);
        }
      });

      setSearchResults(results);
    } catch {
      // Graceful fallback for demo search
      const lower = trimmed.toLowerCase();
      const demoMatches = DEFAULT_USERS.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower),
      );
      setSearchResults(demoMatches);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      startTransition(() => {
        router.replace("/search");
      });
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(value);
    }, 280);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery("");
    setSearchResults([]);
    setIsSearching(false);
    startTransition(() => {
      router.replace("/search");
    });
    searchInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(query);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasQuery = Boolean(query.trim());
  const usersToDisplay = hasQuery
    ? searchResults
    : showAll
      ? recentDisplayUsers
      : recentDisplayUsers.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start">
      {/* Left Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <LeftSidebar userId={currentUser?.id} />
      </div>

      {/* Center Search Card */}
      <div className="min-w-0">
        <div className="rounded-xl border border-[#E6E5E0] bg-white p-6 sm:p-8">
          {/* Overline */}
          <p className="text-[11px] font-semibold tracking-wider text-[#6C6F71] uppercase">
            PRACTITIONER DIRECTORY
          </p>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17191A] tracking-tight mt-1 mb-2">
            Search Network
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#6C6F71]">
            Find colleagues, collaborators, and verified practitioners across disciplines.
          </p>

          {/* Search Input Box */}
          <form onSubmit={handleSubmit} className="mt-6 relative flex items-center">
            <span className="absolute left-3.5 text-[#6C6F71] pointer-events-none">
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </span>

            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by name, discipline, or engineering role..."
              className="w-full h-11 bg-[#F5F4F0] text-sm text-[#17191A] placeholder-[#8A8D90] rounded-lg pl-10 pr-11 border border-[#E6E5E0] hover:border-[#D5D3CC] focus:bg-white focus:border-[#184A45] focus:outline-none transition"
            />

            {/* Apple Spinner when searching, or clear button */}
            <div className="absolute right-4 flex items-center">
              {isSearching ? (
                <AppleSpinner size={18} className="text-slate-400" />
              ) : query ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  title="Clear"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ) : null}
            </div>
          </form>

          {/* Navigation Tabs (People, Posts, Companies, Hashtags, Filters) */}
          <div className="mt-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("people")}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition relative ${
                  activeTab === "people"
                    ? "text-[#184A45] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#184A45]"
                    : "text-[#6C6F71] hover:text-[#17191A]"
                }`}
              >
                People
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition relative ${
                  activeTab === "posts"
                    ? "text-[#184A45] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#184A45]"
                    : "text-[#6C6F71] hover:text-[#17191A]"
                }`}
              >
                Dispatches
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("companies")}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition relative ${
                  activeTab === "companies"
                    ? "text-[#184A45] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#184A45]"
                    : "text-[#6C6F71] hover:text-[#17191A]"
                }`}
              >
                Teams
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hashtags")}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition relative ${
                  activeTab === "hashtags"
                    ? "text-[#184A45] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#184A45]"
                    : "text-[#6C6F71] hover:text-[#17191A]"
                }`}
              >
                Topics
              </button>
            </div>

            {/* Filters Button */}
            <button
              type="button"
              className="flex items-center gap-1.5 pb-3 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                />
              </svg>
              <span>Filters</span>
            </button>
          </div>

          {/* Section Heading: Suggested for you / Search Results */}
          <div className="pt-6 pb-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {hasQuery ? `Search results for "${query}"` : "Suggested for you"}
            </h2>
            {!hasQuery && (
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                {showAll ? "Show less" : "See all"}
              </button>
            )}
          </div>

          {/* Content Area: Skeletons ONLY when loading recently joined members */}
          {isLoadingRecent ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="py-4.5 flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-slate-200 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 rounded bg-slate-200" />
                      <div className="h-3 w-48 rounded bg-slate-100" />
                      <div className="h-2.5 w-24 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="h-8 w-20 rounded-xl bg-slate-100 shrink-0" />
                </div>
              ))}
            </div>
          ) : usersToDisplay.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No people found matching &quot;{query}&quot;
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try searching by a different name.
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                View suggested members
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {usersToDisplay.map((u: any) => (
                <UserListItem
                  key={u.id}
                  user={u}
                  mutualCount={u.mutualCount}
                  mutualAvatars={u.mutualAvatars}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <RightSidebar
          userName={currentUser?.name}
          suggestedUsers={suggestedUsers}
        />
      </div>
    </div>
  );
}
