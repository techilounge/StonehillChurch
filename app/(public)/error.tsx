"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in server/client logs so a bad page is diagnosable
    // instead of failing as a bare 500.
    console.error("Public route render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-stonehill-accent">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-stonehill-primary">
        This page couldn&apos;t be loaded
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        We hit an unexpected problem while loading this page. Please try again in a
        moment.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-stonehill-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stonehill-primary/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
