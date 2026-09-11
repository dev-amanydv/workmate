"use client";

export function TypingIndicator({ userName }: { userName: string }) {
  return (
    <div className="flex items-end gap-2 px-1 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-500">
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-400 pl-1">{userName}</span>
        <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white border border-slate-100 shadow-sm px-4 py-3">
          <span
            className="h-2 w-2 rounded-full bg-slate-400"
            style={{ animation: "typingBounce 1.2s ease-in-out infinite 0ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-slate-400"
            style={{ animation: "typingBounce 1.2s ease-in-out infinite 200ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-slate-400"
            style={{ animation: "typingBounce 1.2s ease-in-out infinite 400ms" }}
          />
        </div>
      </div>
    </div>
  );
}
