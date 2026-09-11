"use client";

import Link from "next/link";
import { Avatar } from "../ui/avatar";

interface CreatePostPromptProps {
  userAvatar?: string | null;
  userName?: string;
}

export function CreatePostPrompt({
  userAvatar,
  userName = "You",
}: CreatePostPromptProps) {
  return (
    <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 transition-colors hover:border-[#D5D3CC]">
      <div className="flex items-center gap-3">
        <Avatar
          src={userAvatar}
          alt={userName}
          fallbackName={userName}
          size={36}
          className="h-9 w-9 rounded-md border border-[#E6E5E0] shrink-0"
        />

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
