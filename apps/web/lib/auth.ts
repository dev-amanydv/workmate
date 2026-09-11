import { getApiBaseUrl } from "./api/client";

export async function logoutUser(): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    await Promise.allSettled([
      fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }),
      fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      }),
    ]);
  } catch {
    // Ignore errors during logout
  } finally {
    window.location.href = "/login";
  }
}
