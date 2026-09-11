import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SearchView } from "../../../components/search/search-view";
import type { SuggestedUser } from "../../../components/feed/right-sidebar";
import { ApiError, apiFetch } from "../../../lib/api/client";
import { getCurrentUser } from "../../../lib/api/user";
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

  const [currentUser, recentRaw, searchRaw, suggestedRaw] = await Promise.all([
    getCurrentUser(cookieHeader),
    apiFetch<any>("/users/recent?limit=12", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
    query
      ? apiFetch<any>(`/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Cookie: cookieHeader },
          cache: "no-store",
        }).catch(() => null)
      : Promise.resolve(null),
    apiFetch<any>("/users/suggested", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }).catch(() => null),
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  let recentUsers: UserProfile[] = [];
  if (Array.isArray(recentRaw)) {
    recentUsers = recentRaw;
  } else if (recentRaw && Array.isArray(recentRaw.data)) {
    recentUsers = recentRaw.data;
  }

  let searchResults: UserProfile[] = [];
  if (Array.isArray(searchRaw)) {
    searchResults = searchRaw;
  } else if (searchRaw && Array.isArray(searchRaw.data)) {
    searchResults = searchRaw.data;
  }

  let suggestedUsers: SuggestedUser[] = [];
  if (Array.isArray(suggestedRaw)) {
    suggestedUsers = suggestedRaw;
  } else if (suggestedRaw && Array.isArray(suggestedRaw.data)) {
    suggestedUsers = suggestedRaw.data;
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
