"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { apiFetch } from "../../lib/api/client";
import { formatRelativeTime } from "../../lib/utils/time";
import type { Post } from "../../types/post";

interface FeedPostCardProps {
  post: Post;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
}

export function FeedPostCard({
  post,
  currentUserId,
  onPostDeleted,
}: FeedPostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const isAuthor = Boolean(currentUserId && post.authorId === currentUserId);
  const displayTime = formatRelativeTime(post.createdAt);

  // Differentiate role instead of generic "Workmate Member"
  const rawRole = post.author.role;
  const authorRole = (!rawRole || rawRole === "Workmate Member")
    ? "Systems & Software Engineer"
    : rawRole;

  const avatarUrl = post.author.avatarUrl || null;
  const authorInitial = (post.author.name || "P").charAt(0).toUpperCase();

  const handleLikeToggle = async () => {
    if (isTogglingLike) return;
    setIsTogglingLike(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      const res = await apiFetch<{
        success: boolean;
        isLiked: boolean;
        likesCount: number;
      }>(`/posts/${post.id}/like`, {
        method: prevLiked ? "DELETE" : "POST",
      });
      if (res && typeof res.isLiked === "boolean") {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/posts/${post.id}`;
      navigator.clipboard?.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      await apiFetch(`/posts/${post.id}`, { method: "DELETE" });
      onPostDeleted?.(post.id);
    } catch {
      alert("Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  // Simple, human attribution
  let appreciationProof: string;
  if (isLiked) {
    if (likesCount <= 1) {
      appreciationProof = "You liked this post";
    } else {
      const others = likesCount - 1;
      appreciationProof = `You and ${others} ${others === 1 ? "other" : "others"} liked`;
    }
  } else if (likesCount > 0) {
    appreciationProof = `${likesCount} ${likesCount === 1 ? "person" : "people"} liked this`;
  } else {
    appreciationProof = "Be the first to like this post";
  }

  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <article className="rounded-xl border border-[#E6E5E0] bg-white p-5 sm:p-6 transition-colors hover:border-[#D5D3CC]">
      {/* Header: Author Info and Overflow Menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${post.author.id || post.authorId}`}
            className="shrink-0 hover:opacity-90 transition"
          >
            <Avatar
              src={avatarUrl}
              alt={post.author.name}
              fallbackName={post.author.name}
              size={40}
              className="h-10 w-10 rounded-md border border-[#E6E5E0]"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.id || post.authorId}`}
                className="text-sm font-semibold text-[#17191A] hover:text-[#184A45] transition"
              >
                {post.author.name}
              </Link>
              <span className="text-xs text-[#8A8D90]">•</span>
              <span className="text-xs text-[#6C6F71]">{displayTime}</span>
            </div>
            <p className="text-xs text-[#6C6F71]">{authorRole}</p>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 text-[#6C6F71] hover:text-[#17191A] hover:bg-[#F5F4F0] rounded transition cursor-pointer"
            aria-label="Post options"
          >
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg border border-[#E6E5E0] bg-white py-1 shadow-lg ring-1 ring-black/5 z-20 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 text-[#17191A] hover:bg-[#F5F4F0] transition flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-[#6C6F71]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <span>Copy permalink</span>
              </button>

              {isAuthor && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full text-left px-3.5 py-2 text-[#9E3B27] hover:bg-rose-50 transition flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  <span>{isDeleting ? "Deleting..." : "Delete post"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Text: 15px editorial reading size, 1.6 line height */}
      <div className="mt-4 space-y-3 text-[15px] text-[#17191A] leading-[1.6] font-normal">
        {paragraphs.map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      {/* Media Image if present */}
      {post.imageUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#E6E5E0] bg-[#F5F4F0]">
          <Image
            src={post.imageUrl}
            alt="Post media"
            width={720}
            height={400}
            className="w-full h-auto object-cover max-h-[360px]"
            unoptimized={post.imageUrl.startsWith("http")}
          />
        </div>
      )}

      {/* Restrained Social Proof Bar (Replacing the 4-emoji Slack row) */}
      <div className="mt-5 flex items-center justify-between border-b border-[#EDECE8] pb-3 text-xs text-[#6C6F71]">
        <div className="flex items-center gap-2">
          {likesCount > 0 && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#184A45] text-white text-[9px] font-bold">
              ✓
            </span>
          )}
          <span className="font-medium text-[#484B4D]">
            {appreciationProof}
          </span>
        </div>

        <Link
          href={`/posts/${post.id}`}
          className="text-[11px] text-[#8A8D90] hover:text-[#184A45] transition"
        >
          View details
        </Link>
      </div>

      {/* Action Affordances: Like + Share */}
      <div className="relative mt-2 flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={isTogglingLike}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            isLiked
              ? "text-[#9E3B27] bg-[#FAF0EE] font-semibold"
              : "text-[#484B4D] hover:text-[#9E3B27] hover:bg-[#F5F4F0]"
          }`}
        >
          <svg
            className={`w-4 h-4 ${
              isLiked ? "fill-[#9E3B27] stroke-[#9E3B27]" : "fill-none stroke-current"
            }`}
            strokeWidth={1.75}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <span>{isLiked ? "Liked" : "Like"}</span>
          {likesCount > 0 && (
            <span className="ml-1 text-[11px] opacity-80">({likesCount})</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium text-[#484B4D] hover:text-[#184A45] hover:bg-[#F5F4F0] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span>Share</span>
        </button>

        {showShareToast && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#17191A] px-3 py-1 text-xs text-white shadow">
            Permalink copied
          </div>
        )}
      </div>
    </article>
  );
}
