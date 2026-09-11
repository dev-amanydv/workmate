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
  const userInitial = (userName || "P").charAt(0).toUpperCase();

  return (
    <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 transition-colors hover:border-[#D5D3CC]">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[#E6E5E0] bg-[#EEF4F3] flex items-center justify-center">
          {userAvatar && !imageError ? (
            <Image
              src={userAvatar}
              alt={userName}
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized={userAvatar.startsWith("http")}
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-xs font-semibold text-[#184A45]">
              {userInitial}
            </span>
          )}
        </div>

        <Link
          href="/posts/create"
          className="flex-1 rounded-lg border border-[#E6E5E0] bg-[#F5F4F0] hover:bg-[#EFEFEA] px-3.5 py-2.5 text-xs sm:text-sm text-[#6C6F71] hover:text-[#17191A] transition cursor-pointer flex items-center justify-between"
        >
          <span>Share an update, idea, or question...</span>
          <span className="hidden sm:inline text-[11px] font-medium text-[#184A45] bg-white border border-[#E6E5E0] px-2 py-0.5 rounded">
            Draft
          </span>
        </Link>
      </div>

      
    </div>
  );
}
