import Image from "next/image";
import type { Post } from "../../types/post";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const authorInitial = (post.author?.name || "U").charAt(0).toUpperCase();

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          {post.author?.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span>{authorInitial}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {post.author?.name || "Unknown Author"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(post.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
        {post.content}
      </p>

      {post.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 dark:border-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt="Post media"
            className="max-h-96 w-auto max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </article>
  );
}
