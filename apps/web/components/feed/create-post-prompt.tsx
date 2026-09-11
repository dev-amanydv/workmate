"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface CreatePostPromptProps {
  userAvatar?: string | null;
  userName?: string;
}

export function CreatePostPrompt({
  userAvatar,
  userName = "You",
}: CreatePostPromptProps) {
  const [imageError, setImageError] = useState(false);
  const userInitial = (userName || "U").charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300/80">
      <div className="flex items-center gap-3.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-2xs bg-blue-50 flex items-center justify-center">
          {userAvatar && !imageError ? (
            <Image
              src={userAvatar}
              alt={userName}
              width={44}
              height={44}
              className="h-full w-full object-cover"
              unoptimized={userAvatar.startsWith("http")}
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-sm font-bold text-blue-600">
              {userInitial}
            </span>
          )}
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
