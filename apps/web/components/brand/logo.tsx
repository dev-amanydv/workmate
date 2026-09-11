import React from "react";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

export function WorkmateLogo({
  className = "",
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const markDimensions = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  }[size];

  const textSize = {
    sm: "text-[15px]",
    md: "text-[17px]",
    lg: "text-xl",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        className={`${markDimensions} shrink-0 text-[#184A45]`}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="6" fill="#184A45" />
        <path
          d="M7.2 9.5H10.1L12.9 20.3L15.95 11.8H16.05L19.1 20.3L21.9 9.5H24.8L21.1 22.5H18.3L16 15L13.7 22.5H10.9L7.2 9.5Z"
          fill="#FBFBFA"
        />
        <circle cx="24.5" cy="8" r="1.3" fill="#9E3B27" />
      </svg>

      {showWordmark && (
        <span
          className={`font-semibold tracking-[-0.03em] text-[#17191A] ${textSize} leading-none`}
        >
          Workmate
        </span>
      )}
    </div>
  );
}
