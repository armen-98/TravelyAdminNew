import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place claims",
};

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
