"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "../ui/avatar";
import { apiFetch } from "../../lib/api/client";
import type { Post } from "../../types/post";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onPostUpdated?: (updated: Post) => void;
  onPostDeleted?: (postId: string) => void;
  isDetailView?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  onPostUpdated,
  onPostDeleted,
  isDetailView = false,
}: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [isFollowing, setIsFollowing] = useState(
    post.author?.isFollowing ?? false,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = Boolean(currentUserId && post.authorId === currentUserId);
  const authorInitial = (post.author?.name || "U").charAt(0).toUpperCase();

  const handleCardClick = () => {
    if (isDetailView || isEditing) return;
    if (window.getSelection()?.toString().length) return;
    router.push(`/posts/${post.id}`);
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingLike) return;
    setIsTogglingLike(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await apiFetch<{
        success: boolean;
        isLiked: boolean;
        likesCount: number;
      }>(`/posts/${post.id}/like`, {
        method: prevLiked ? "DELETE" : "POST",
      });
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch (err: unknown) {
      // Revert optimistic state on error
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingFollow || isAuthor) return;
    setIsTogglingFollow(true);

    const prevFollowing = isFollowing;
    setIsFollowing(!prevFollowing);

    try {
      if (!prevFollowing) {
        await apiFetch(`/follows/${post.authorId}`, { method: "POST" });
      } else {
        await apiFetch(`/follows/${post.authorId}`, { method: "DELETE" });
      }
    } catch (err: unknown) {
      setIsFollowing(prevFollowing);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthor || isDeleting) return;

    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiFetch(`/posts/${post.id}`, { method: "DELETE" });
      onPostDeleted?.(post.id);
      if (isDetailView) {
        router.push("/feed");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete post",
      );
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editContent.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await apiFetch<Post>(`/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: editContent.trim() }),
      });
      setIsEditing(false);
      onPostUpdated?.(updated);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update post",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`relative rounded-xl border border-[#E6E5E0] bg-white p-5 transition-colors ${
        !isDetailView && !isEditing
          ? "cursor-pointer hover:border-[#D5D3CC]"
          : ""
      }`}
    >
      {error && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {/* Post Header: Author, Date, Follow, Edit/Delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.author?.avatarUrl}
            alt={post.author?.name || "Author"}
            fallbackName={post.author?.name}
            size={40}
            className="h-10 w-10 rounded-md border border-[#E6E5E0] shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-[#17191A]">
                {post.author?.name || "Unknown Author"}
              </p>

              {/* Follow Button: shown if user has not followed the post owner in feed (and not author) */}
              {!isAuthor && currentUserId && (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={isTogglingFollow}
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition ${
                    isFollowing
                      ? "border border-[#E6E5E0] bg-[#F5F4F0] text-[#17191A] hover:bg-[#EFEFEA]"
                      : "bg-[#184A45] text-white hover:bg-[#133D39]"
                  }`}
                  title={isFollowing ? "Click to unfollow" : "Click to follow"}
                >
                  {isTogglingFollow
                    ? "..."
                    : isFollowing
                      ? "Following"
                      : "+ Follow"}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(post.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons: Only show Edit and Delete if the post belongs to current user */}
        {isAuthor && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditContent(post.content);
                setError(null);
              }}
              title="Edit post"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-blue-400"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>{isEditing ? "Cancel" : "Edit"}</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete post"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 shadow-xs transition hover:bg-red-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/50 disabled:opacity-50"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>{isDeleting ? "..." : "Delete"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Post Content / Edit Form */}
      {isEditing ? (
        <form
          onSubmit={handleEditSubmit}
          onClick={(e) => e.stopPropagation()}
          className="mt-3 space-y-3"
        >
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            placeholder="Edit your post..."
            maxLength={5000}
            required
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !editContent.trim()}
              className="rounded-lg bg-[#184A45] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#133D39] disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.6] text-[#17191A]">
          {post.content}
        </p>
      )}

      {/* Post Image */}
      {post.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[#E6E5E0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt="Post media"
            className="max-h-96 w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      )}

      {/* Footer: Likes and Detail Indicator */}
      <div className="mt-4 flex items-center justify-between border-t border-[#EDECE8] pt-3">
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={isTogglingLike}
          className={`group flex items-center gap-1.5 text-xs font-medium transition ${
            isLiked
              ? "text-[#9E3B27]"
              : "text-[#6C6F71] hover:text-[#9E3B27]"
          }`}
          title={isLiked ? "Unlike post" : "Appreciate post"}
        >
          <svg
            className={`h-4 w-4 ${
              isLiked ? "fill-[#9E3B27] text-[#9E3B27]" : "fill-none stroke-current"
            }`}
            viewBox="0 0 24 24"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>
            {likesCount} {likesCount === 1 ? "appreciation" : "appreciations"}
          </span>
        </button>

        {!isDetailView && (
          <span className="text-xs font-medium text-[#6C6F71] transition group-hover:text-[#184A45]">
            View post
          </span>
        )}
      </div>
    </article>
  );
}
