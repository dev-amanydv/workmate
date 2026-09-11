interface AppleSpinnerProps {
  size?: number;
  className?: string;
}

export function AppleSpinner({
  size = 18,
  className = "text-slate-400",
}: AppleSpinnerProps) {
  const bars = 12;
  return (
    <svg
      className={`animate-spin ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label="Loading"
    >
      {[...Array(bars)].map((_, i) => {
        const angle = (i * 360) / bars;
        const opacity = ((i + 1) / bars) * 0.85 + 0.15;
        return (
          <rect
            key={i}
            x="11"
            y="2"
            width="2"
            height="5"
            rx="1"
            fill="currentColor"
            opacity={opacity}
            transform={`rotate(${angle} 12 12)`}
          />
        );
      })}
    </svg>
  );
}
