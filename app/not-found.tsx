import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-lg font-semibold">Page not found</div>
      <div className="text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist.
      </div>
      <Link className="text-sm font-medium underline" href="/">
        Go to dashboard
      </Link>
    </div>
  );
}
