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
          <span>Share a technical insight, architectural decision, or question...</span>
          <span className="hidden sm:inline text-[11px] font-medium text-[#184A45] bg-white border border-[#E6E5E0] px-2 py-0.5 rounded">
            Draft
          </span>
        </Link>
      </div>

      {/* Quick Format Affordances */}
      <div className="mt-3 pt-3 border-t border-[#EDECE8] flex items-center justify-between text-xs text-[#6C6F71]">
        <div className="flex items-center gap-4">
          <Link
            href="/posts/create"
            className="flex items-center gap-1.5 hover:text-[#17191A] transition"
          >
            <svg className="w-4 h-4 text-[#184A45]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-[11px] font-medium">Article Dispatch</span>
          </Link>

          <Link
            href="/posts/create"
            className="flex items-center gap-1.5 hover:text-[#17191A] transition"
          >
            <svg className="w-4 h-4 text-[#6C6F71]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-[11px] font-medium">Diagram / Image</span>
          </Link>
        </div>

        <Link
          href="/posts/create"
          className="text-[11px] font-semibold text-[#184A45] hover:underline"
        >
          Open Composer
        </Link>
      </div>
    </div>
  );
}
