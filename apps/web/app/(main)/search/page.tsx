import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SearchView } from "../../../components/search/search-view";
import type { SuggestedUser } from "../../../components/feed/right-sidebar";
import { ApiError, apiFetch } from "../../../lib/api/client";
import type { UserProfile } from "../../../types/user";

export const metadata: Metadata = {
  title: "Search People | Workmate",
  description: "Search for professionals and colleagues on Workmate by name or email.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = (await searchParams) || {};
  const query = (q || "").trim();

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let currentUser: UserProfile | null = null;
  try {
    currentUser = await apiFetch<UserProfile>("/users/me", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    currentUser = null;
  }

  let recentUsers: UserProfile[] = [];
  try {
    const res = await apiFetch<any>("/users/recent?limit=12", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (Array.isArray(res)) {
      recentUsers = res;
    } else if (res && Array.isArray(res.data)) {
      recentUsers = res.data;
    }
  } catch {
    recentUsers = [];
  }

  let searchResults: UserProfile[] = [];
  if (query) {
    try {
      const res = await apiFetch<any>(`/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      });
      if (Array.isArray(res)) {
        searchResults = res;
      } else if (res && Array.isArray(res.data)) {
        searchResults = res.data;
      }
    } catch {
      searchResults = [];
    }
  }

  let suggestedUsers: SuggestedUser[] = [];
  try {
    const res = await apiFetch<any>("/users/suggested", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (Array.isArray(res)) {
      suggestedUsers = res;
    } else if (res && Array.isArray(res.data)) {
      suggestedUsers = res.data;
    }
  } catch {
    suggestedUsers = [];
  }

  return (
    <SearchView
      currentUser={currentUser}
      initialQuery={query}
      initialRecentUsers={recentUsers}
      initialSearchResults={searchResults}
      suggestedUsers={suggestedUsers}
    />
  );
}
