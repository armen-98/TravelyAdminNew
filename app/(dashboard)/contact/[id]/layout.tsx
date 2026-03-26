import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
