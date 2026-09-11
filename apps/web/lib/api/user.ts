import { cache } from "react";
import { apiFetch } from "./client";
import type { UserProfile } from "../../types/user";

export const getCurrentUser = cache(
  async (cookieHeader: string): Promise<UserProfile | null> => {
    try {
      return await apiFetch<UserProfile>("/users/me", {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      });
    } catch {
      return null;
    }
  },
);
