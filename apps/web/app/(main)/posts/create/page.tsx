"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreatePostForm } from "../../../../components/posts/create-post-form";

export default function CreatePostPage() {
  const router = useRouter();

  const handlePostCreated = () => {
    router.push("/feed");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/feed"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-2xs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Create a Post</h1>
        </div>
      </div>

      <CreatePostForm onPostCreated={handlePostCreated} />
    </div>
  );
}
