"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "../ui/avatar";
import { apiFetch } from "../../lib/api/client";
import { formatRelativeTime } from "../../lib/utils/time";
import type { Post } from "../../types/post";

interface FeedPostCardProps {
  post: Post;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updated: Post) => void;
}

export function FeedPostCard({
  post,
  currentUserId,
  onPostDeleted,
  onPostUpdated,
}: FeedPostCardProps) {
  const [content, setContent] = useState(post.content);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = Boolean(currentUserId && post.authorId === currentUserId);
  const displayTime = formatRelativeTime(post.createdAt);

  const rawRole = post.author.role;
  const authorRole = (!rawRole || rawRole === "Workmate Member")
    ? "Systems & Software Engineer"
    : rawRole;

  const avatarUrl = post.author.avatarUrl || null;
  const authorInitial = (post.author.name || "P").charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowMenu(false);
        if (!isSavingEdit) setShowEditModal(false);
        if (!isDeleting) setShowDeleteModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSavingEdit, isDeleting]);

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

  const handleOpenEdit = () => {
    setEditContent(content);
    setEditError(null);
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingEdit) return;

    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError("Post content cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const res = await apiFetch<any>(`/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: trimmed }),
      });
      const updatedPost: Post = res?.data || res;
      setContent(updatedPost?.content || trimmed);
      onPostUpdated?.(updatedPost);
      setShowEditModal(false);
    } catch (err: any) {
      setEditError(err?.message || "Failed to update post. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenDelete = () => {
    setShowMenu(false);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiFetch(`/posts/${post.id}`, { method: "DELETE" });
      setShowDeleteModal(false);
      onPostDeleted?.(post.id);
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

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

  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <article className="rounded-xl border-px border-[#e7e7e7] bg-white p-5 sm:p-6 transition-colors hover:border-[#D5D3CC]">
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

        <div className="relative" ref={menuRef}>
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
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[#E6E5E0] bg-white py-1 shadow-lg ring-1 ring-black/5 z-20 text-xs">
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
                <>
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="w-full text-left px-3.5 py-2 text-[#17191A] hover:bg-[#F5F4F0] transition flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-[#6C6F71]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    <span>Edit post</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenDelete}
                    className="w-full text-left px-3.5 py-2 text-[#9E3B27] hover:bg-[#FAF0EE] transition flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <span>Delete post</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3 text-[15px] text-[#17191A] leading-[1.6] font-normal">
        {paragraphs.map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

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

      <div className="relative mt-2 flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={isTogglingLike}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            isLiked
              ? "text-[#9E3B27]  font-semibold"
              : "text-[#484B4D] hover:text-[#9E3B27] hover:bg-[#F5F4F0]"
          }`}
        >
          <svg
            className={`w-4 h-4 ${
              isLiked ? "fill-[#9E3B27] " : "fill-none stroke-current"
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

      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isSavingEdit) setShowEditModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-post-title-${post.id}`}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.05)] transition-all animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EDECE8]">
              <div>
                <h3 id={`edit-post-title-${post.id}`} className="text-base font-bold text-[#17191A]">
                  Edit post
                </h3>
                <p className="text-xs text-[#6C6F71] mt-0.5">
                  Update your post content visible to your network.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={isSavingEdit}
                className="p-1.5 text-[#6C6F71] hover:text-[#17191A] hover:bg-[#F5F4F0] rounded-lg transition cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSave} className="mt-4 space-y-4">
              {editError && (
                <div className="rounded-lg bg-[#FAF0EE] border border-[#EACEC8] p-3 text-xs text-[#9E3B27] flex items-center justify-between">
                  <span>{editError}</span>
                  <button
                    type="button"
                    onClick={() => setEditError(null)}
                    className="text-[#9E3B27] hover:opacity-75 ml-2 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Avatar
                  src={avatarUrl}
                  alt={post.author.name}
                  fallbackName={post.author.name}
                  size={36}
                  className="h-9 w-9 rounded-md border border-[#E6E5E0] object-cover"
                />
                <div>
                  <p className="text-xs font-semibold text-[#17191A] leading-snug">
                    {post.author.name}
                  </p>
                  <p className="text-[11px] text-[#6C6F71] leading-snug">
                    {authorRole}
                  </p>
                </div>
              </div>

              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    if (e.target.value.length <= 2000) {
                      setEditContent(e.target.value);
                    }
                  }}
                  rows={5}
                  autoFocus
                  disabled={isSavingEdit}
                  placeholder="What would you like to share?"
                  className="w-full rounded-xl border border-[#E6E5E0] bg-[#FBFBFA] p-3.5 text-sm text-[#17191A] placeholder-[#8A8D90] focus:border-[#184A45] focus:outline-hidden transition resize-none leading-relaxed"
                />
                <div className="flex justify-end pt-1">
                  <span className="text-[11px] text-[#8A8D90]">
                    {editContent.length}/2,000
                  </span>
                </div>
              </div>

              {post.imageUrl && (
                <div className="relative rounded-xl border border-[#E6E5E0] overflow-hidden bg-[#F5F4F0] max-h-48">
                  <Image
                    src={post.imageUrl}
                    alt="Post attachment preview"
                    width={500}
                    height={200}
                    className="w-full h-auto object-cover max-h-48"
                    unoptimized={post.imageUrl.startsWith("http")}
                  />
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] text-white">
                    Attached image
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EDECE8]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingEdit}
                  className="rounded-lg border border-[#E6E5E0] bg-white px-4 py-2 text-xs font-semibold text-[#484B4D] hover:bg-[#F5F4F0] transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editContent.trim()}
                  className="rounded-lg bg-[#184A45] hover:bg-[#133D39] px-5 py-2 text-xs font-semibold text-white transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeleting) setShowDeleteModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-post-title-${post.id}`}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.05)] transition-all animate-in zoom-in-95 duration-150 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF0EE] text-[#9E3B27] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>

            <h3 id={`delete-post-title-${post.id}`} className="text-base font-bold text-[#17191A]">
              Delete post?
            </h3>
            <p className="mt-1.5 text-xs text-[#6C6F71] leading-relaxed px-2">
              This action cannot be undone. This post will be permanently removed from your feed and profile.
            </p>

            {deleteError && (
              <div className="mt-3 rounded-lg bg-[#FAF0EE] border border-[#EACEC8] p-2 text-xs text-[#9E3B27]">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full rounded-lg bg-[#9E3B27] hover:bg-[#863120] py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete post</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full rounded-lg border border-[#E6E5E0] bg-white hover:bg-[#F5F4F0] py-2.5 text-xs font-semibold text-[#17191A] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
