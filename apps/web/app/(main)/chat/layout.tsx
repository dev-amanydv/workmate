import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages · Workmate",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
