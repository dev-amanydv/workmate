"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

export const DEFAULT_AVATAR_FALLBACK = "/default-avatar.svg";

export function Avatar({
  src,
  alt = "Avatar",
  name,
  size = 40,
  width,
  height,
  className = "h-full w-full object-cover",
  fallbackSrc = DEFAULT_AVATAR_FALLBACK,
  priority = false,
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

  return (
    <Image
      src={effectiveSrc}
      alt={alt || name || "Avatar"}
      width={finalWidth}
      height={finalHeight}
      className={className}
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
