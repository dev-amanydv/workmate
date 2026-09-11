"use client";

import { useState } from "react";
import Image from "next/image";
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
  const [imageError, setImageError] = useState(false);

  const isAuthor = Boolean(currentUserId && post.authorId === currentUserId);

  // Determine display time
  const displayTime = formatRelativeTime(post.createdAt);

  // Determine author role
  const authorRole = post.author.role || "Workmate Member";

  // Determine avatar
  const avatarUrl = post.author.avatarUrl || null;

  const authorInitial = (post.author.name || "U").charAt(0).toUpperCase();

  // Handle Like Toggle with real backend
  const handleLikeToggle = async () => {
    if (isTogglingLike) return;
    setIsTogglingLike(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
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
      // Revert optimistic state on network error
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsTogglingLike(false);
    }
  };

  // Handle Share: copy permalink
  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/posts/${post.id}`;
      navigator.clipboard?.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  // Handle Delete Post with real backend
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

  // Determine Reactions string
  let reactionsText: string;
  if (isLiked) {
    reactionsText =
      likesCount <= 1
        ? "You liked this"
        : `You and ${likesCount - 1} ${likesCount - 1 === 1 ? "other" : "others"}`;
  } else {
    reactionsText =
      likesCount > 0
        ? `${likesCount} ${likesCount === 1 ? "like" : "likes"}`
        : "Be the first to like";
  }

  // Determine stats text
  const statsText = likesCount > 0 ? `${likesCount} ${likesCount === 1 ? "like" : "likes"}` : "";

  // Split text content into paragraphs
  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition hover:border-slate-300/80">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-2xs bg-blue-50 flex items-center justify-center">
            {avatarUrl && !imageError ? (
              <Image
                src={avatarUrl}
                alt={post.author.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized={avatarUrl.startsWith("http")}
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-blue-600">
                {authorInitial}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer">
                {post.author.name}
              </h3>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400">{displayTime}</span>
            </div>
            <p className="text-xs text-slate-500 font-normal">{authorRole}</p>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
            aria-label="Post options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-20 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <span>Copy link</span>
              </button>

              {isAuthor && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  <span>{isDeleting ? "Deleting..." : "Delete post"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Text */}
      <div className="mt-4 space-y-3 text-sm text-slate-800 leading-relaxed font-normal">
        {paragraphs.map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      {/* Media Image if present */}
      {post.imageUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-2xs">
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

      {/* Reactions Bar */}
      <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {/* Reaction Emoji Badges */}
          <div className="flex -space-x-1 items-center">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 ring-2 ring-white text-[11px] shadow-2xs">
              ❤️
            </span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 ring-2 ring-white text-[11px] shadow-2xs">
              👍
            </span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 ring-2 ring-white text-[11px] shadow-2xs">
              🔥
            </span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 ring-2 ring-white text-[11px] shadow-2xs">
              👏
            </span>
          </div>
          <span className="hover:underline cursor-pointer font-medium text-slate-600">
            {reactionsText}
          </span>
        </div>

        <div className="font-normal text-slate-400">
          <span>{statsText}</span>
        </div>
      </div>

      {/* Action Buttons: ONLY Like and Share as specified */}
      <div className="relative mt-2 flex items-center justify-around pt-1">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={isTogglingLike}
          className={`flex items-center gap-2 rounded-xl px-6 py-2 text-xs font-semibold transition cursor-pointer ${
            isLiked
              ? "text-rose-600 bg-rose-50/60"
              : "text-slate-600 hover:text-rose-600 hover:bg-slate-50"
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isLiked ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-current"
            }`}
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <span>Like</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl px-6 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span>Share</span>
        </button>

        {/* Share Toast */}
        {showShareToast && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-1 text-xs text-white shadow-lg animate-fade-in">
            Link copied to clipboard!
          </div>
        )}
      </div>
    </article>
  );
}
