import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "../../components/logout-button";

export const metadata: Metadata = {
  title: "Feed — Workmate",
  description: "Workmate authenticated feed",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/feed"
            className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm">
              W
            </span>
            <span>Workmate</span>
          </Link>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
