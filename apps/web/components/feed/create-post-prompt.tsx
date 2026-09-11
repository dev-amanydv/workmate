"use client";

import Image from "next/image";
import Link from "next/link";

interface CreatePostPromptProps {
  userAvatar?: string;
  userName?: string;
}

export function CreatePostPrompt({
  userAvatar = "/mock/avatar-aman-large.jpg",
  userName = "Aman",
}: CreatePostPromptProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300/80">
      <div className="flex items-center gap-3.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-2xs">
          <Image
            src={userAvatar}
            alt={userName}
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        </div>

        <Link
          href="/posts/create"
          className="flex-1 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 px-4 py-3 text-sm text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center"
        >
          <span>Share your thoughts, a win, or something you&apos;re working on...</span>
        </Link>
      </div>
    </div>
  );
}
