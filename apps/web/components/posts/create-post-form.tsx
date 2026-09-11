"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { ApiError, apiFetch } from "../../lib/api/client";
import type { Post } from "../../types/post";

interface CreatePostFormProps {
  onPostCreated?: (post: Post) => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
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

      const post = await apiFetch<Post>("/posts", {
        method: "POST",
        body: formData,
      });

      setContent("");
      removeImage();
      onPostCreated?.(post);
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
    <div className="rounded-xl border border-[#E6E5E0] bg-white p-6 transition-colors">
      <h3 className="mb-3 text-base font-semibold text-[#17191A]">
        Create Post
      </h3>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-[#9E3B27] border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update, idea, or question for your network..."
            className="w-full rounded-lg border border-[#E6E5E0] p-3 text-sm text-[#17191A] placeholder-[#8A8D90] focus:border-[#184A45] focus:outline-none transition"
            disabled={isSubmitting}
          />
        </div>

        {imagePreview && (
          <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-[#E6E5E0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Selected preview"
              className="max-h-64 w-auto max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 rounded bg-black/75 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-black/90 cursor-pointer"
              disabled={isSubmitting}
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#EDECE8] pt-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E6E5E0] px-3 py-1.5 text-xs font-medium text-[#484B4D] hover:bg-[#F5F4F0] transition">
            <span>Attach image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-[#184A45] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#133D39] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Posting..." : "Create Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
