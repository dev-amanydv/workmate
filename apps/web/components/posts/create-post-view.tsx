"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "../feed/left-sidebar";
import { RightSidebar, type SuggestedUser } from "../feed/right-sidebar";
import { Avatar } from "../ui/avatar";
import { ApiError, apiFetch } from "../../lib/api/client";
import type { Post } from "../../types/post";
import type { UserProfile } from "../../types/user";

interface CreatePostViewProps {
  currentUser?: UserProfile | null;
  suggestedUsers?: SuggestedUser[];
}

export function CreatePostView({
  currentUser,
  suggestedUsers = [],
}: CreatePostViewProps) {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [audience, setAudience] = useState<"Everyone" | "Connections">("Everyone");
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const audienceRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = currentUser?.name || "Aman Yadav";
  const userAvatar = currentUser?.avatarUrl || "/mock/avatar-aman.jpg";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (audienceRef.current && !audienceRef.current.contains(event.target as Node)) {
        setIsAudienceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setImageFile(file);
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/feed");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write something before posting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await apiFetch<Post>("/posts", {
        method: "POST",
        body: formData,
      });

      router.push("/feed");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_310px] xl:grid-cols-[240px_1fr_330px] gap-6 items-start h-full overflow-hidden">
      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pr-1 shrink-0">
        <LeftSidebar userId={currentUser?.id} />
      </div>

      <div className="h-full overflow-y-auto no-scrollbar py-6 px-1 min-w-0 pb-12">
        <div className="mb-5 flex items-start gap-3.5">
          
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Create a Post
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              Share an update, idea, or question with your network.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-0 md:border border-slate-200 md:bg-white shadow-2xs overflow-hidden"
        >
          <div className="sm:p-7">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border border-[#E6E5E0] bg-[#EEF4F3]">
                <Avatar
                  src={userAvatar}
                  alt={displayName}
                  size={44}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-[15px] font-semibold text-[#0F172A] leading-tight">
                  {displayName}
                </span>

            
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-[#9E3B27] border border-red-100 flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="rounded-xl  border-slate-200 bg-white p-4 focus-within:border-slate-400  focus-within:ring-slate-300/40 transition-all relative">
              <textarea
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= 2000) {
                    setContent(e.target.value);
                  }
                }}
                placeholder="What’s on your mind?"
                rows={6}
                className="w-full resize-none bg-transparent text-[15px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none leading-relaxed min-h-[140px] sm:min-h-[160px]"
                disabled={isSubmitting}
              />
              <div className="flex justify-end pt-1">
                <span className="text-xs text-slate-400 font-normal select-none">
                  {content.length.toLocaleString()}/2,000
                </span>
              </div>
            </div>

            <div className="mt-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-3.5 text-left group cursor-pointer focus:outline-none"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-200/80">
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.75} />
                    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.75} />
                    <path
                      d="M21 15l-5-5L5 21"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    Add a photo
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    JPG, PNG or GIF (max 10MB)
                  </p>
                </div>
              </button>

              {imagePreview && (
                <div className="mt-4 relative inline-block max-w-full rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={imagePreview}
                    alt="Selected preview"
                    className="max-h-72 w-auto max-w-full rounded-xl object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2.5 top-2.5 rounded-lg bg-black/75 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-black/90 transition cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div className="px-6 py-4 sm:px-7 sm:py-5 flex justify-end items-center bg-white">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="rounded-xl bg-[#5E8079] px-7 py-2.5 text-sm font-medium text-white transition hover:bg-[#4E6C66] active:bg-[#425E59] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>

      <div className="hidden lg:block h-full overflow-y-auto no-scrollbar py-6 pl-1 shrink-0">
        <RightSidebar userName={currentUser?.name} suggestedUsers={suggestedUsers} />
      </div>
    </div>
  );
}
