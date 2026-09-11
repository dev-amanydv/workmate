"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  fallbackName?: string;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  rounded?: "full" | "md" | "lg" | "xl" | "none";
}

export const DEFAULT_AVATAR_FALLBACK = "/default-avatar.svg";

export function Avatar({
  src,
  alt = "Avatar",
  name,
  fallbackName,
  size = 40,
  width,
  height,
  className = "h-full w-full object-cover",
  fallbackSrc = DEFAULT_AVATAR_FALLBACK,
  priority = false,
  rounded,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const hasValidSrc = !hasError && typeof src === "string" && src.trim().length > 0;
  const effectiveSrc = hasValidSrc ? src! : fallbackSrc;
  const isSvg = effectiveSrc.endsWith(".svg");
  const isHttp = effectiveSrc.startsWith("http://") || effectiveSrc.startsWith("https://");

  const roundedClass = rounded === "full" ? "rounded-full" : rounded ? `rounded-${rounded}` : "";

  return (
    <Image
      src={effectiveSrc}
      alt={alt || name || fallbackName || "Avatar"}
      width={finalWidth}
      height={finalHeight}
      className={`object-cover overflow-hidden ${roundedClass} ${className}`.trim()}
      unoptimized={isHttp || isSvg}
      priority={priority}
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
    />
  );
}
