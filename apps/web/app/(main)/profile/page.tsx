import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "../../../lib/api/client";
import type { UserProfile } from "../../../types/user";

export default async function MyProfilePage() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  let user: UserProfile | null = null;
  try {
    user = await apiFetch<UserProfile>("/users/me", {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    redirect("/login");
  }

  if (!user || !user.id) {
    redirect("/login");
  }

  redirect(`/profile/${user.id}`);
}
