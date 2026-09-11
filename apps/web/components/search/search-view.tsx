"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "../feed/left-sidebar";
import { RightSidebar, type SuggestedUser } from "../feed/right-sidebar";
import { UserCard } from "./user-card";
import { apiFetch } from "../../lib/api/client";
import type { UserProfile } from "../../types/user";

interface SearchViewProps {
  currentUser?: UserProfile | null;
  initialQuery?: string;
  initialRecentUsers?: UserProfile[];
  initialSearchResults?: UserProfile[];
  suggestedUsers?: SuggestedUser[];
}

export function SearchView({
  currentUser,
  initialQuery = "",
  initialRecentUsers = [],
  initialSearchResults = [],
  suggestedUsers = [],
}: SearchViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<UserProfile[]>(initialSearchResults);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>(initialRecentUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery.trim()));

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Perform search fetch
  const executeSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      setIsLoading(false);
      startTransition(() => {
        router.replace("/search");
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    startTransition(() => {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
    });

    try {
      const res = await apiFetch<any>(`/users/search?q=${encodeURIComponent(trimmed)}`);
      if (Array.isArray(res)) {
        setSearchResults(res);
      } else if (res && Array.isArray(res.data)) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search on input change
  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsLoading(false);
      startTransition(() => {
        router.replace("/search");
      });
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(value);
    }, 300);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setIsLoading(false);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isQueryActive = Boolean(query.trim() && hasSearched);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start">
      {/* Left Sidebar */}
      <div className="hidden lg:block sticky top-22">
        <LeftSidebar userId={currentUser?.id} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6 min-w-0">
        {/* Hero & Search Header */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-700 mb-3">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>Member Directory</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Discover People
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Find colleagues, collaborators, and friends across Workmate. Search instantly by their full name or email address.
            </p>

            {/* Search Input Box */}
            <form onSubmit={handleSubmit} className="mt-6 relative flex items-center">
              <span className="absolute left-4 text-slate-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by name or email (e.g. Alex, alex@workmate.com)..."
                className="w-full h-12 bg-white text-sm text-slate-900 placeholder-slate-400 rounded-2xl pl-11 pr-24 border border-slate-200 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition"
              />

              <div className="absolute right-3 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {isLoading ? (
                  <div className="p-1 text-blue-600">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 active:scale-[0.98] transition cursor-pointer"
                  >
                    Search
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Decorative ambient background blur */}
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-blue-300/25 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 right-24 h-36 w-36 rounded-full bg-indigo-300/20 blur-xl pointer-events-none" />
        </div>

        {/* Search Results Section */}
        {isQueryActive && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Search Results
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {searchResults.length}
                </span>
              </div>

              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Clear search
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs animate-pulse">
                    <div className="flex items-start gap-3.5">
                      <div className="h-12 w-12 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/2 rounded bg-slate-200" />
                        <div className="h-3 w-3/4 rounded bg-slate-100" />
                        <div className="h-3 w-full rounded bg-slate-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-xs">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  No people found matching &quot;{query}&quot;
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Try checking the spelling, or search using their full name or email address.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    View Recently Joined People
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recently Joined People Section */}
        {(!isQueryActive || searchResults.length > 0) && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Recently Joined People
                  </h2>
                  <p className="text-xs text-slate-500">
                    Welcome new members who recently joined the Workmate community
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                {recentUsers.length} members
              </span>
            </div>

            {recentUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
                <p className="text-xs text-slate-500">
                  No other members have joined yet. Invite friends or colleagues to grow your network!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentUsers.map((user) => (
                  <UserCard key={user.id} user={user} isRecentBadge={true} />
                ))}
              </div>
            )}
          </div>
        )}
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
