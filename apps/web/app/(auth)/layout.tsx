import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Workmate",
  description: "Sign in to Workmate with your Google account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-neutral-950 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
