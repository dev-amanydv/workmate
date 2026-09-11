import type { Metadata } from "next";
import { FeedHeader } from "../../components/feed/feed-header";

export const metadata: Metadata = {
  title: "Workmate",
  description: "A more human professional network",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <FeedHeader />
      <main className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
