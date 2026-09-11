"use client";

export function TypingIndicator({ userName }: { userName: string }) {
  return (
    <div className="flex items-end gap-2 px-1 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex-shrink-0 h-7 w-7 rounded-md border border-[#E6E5E0] bg-[#EEF4F3] flex items-center justify-center">
        <span className="text-[10px] font-semibold text-[#184A45]">
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-[#6C6F71] pl-1">{userName}</span>
        <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs bg-white border border-[#E6E5E0] shadow-xs px-3.5 py-2.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#184A45]/60"
            style={{ animation: "typingBounce 1.2s ease-in-out infinite 0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#184A45]/60"
            style={{ animation: "typingBounce 1.2s ease-in-out infinite 200ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#184A45]/60"
            style={{ animation: "typingBounce 1.2s ease-in-out infinite 400ms" }}
          />
        </div>
      </div>
    </div>
  );
}
