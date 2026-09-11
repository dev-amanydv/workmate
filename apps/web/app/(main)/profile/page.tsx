import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/api/user";

export default async function MyProfilePage() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  const user = await getCurrentUser(cookieHeader);
  if (!user || !user.id) {
    redirect("/login");
  }

  redirect(`/profile/${user.id}`);
}
