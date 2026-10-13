"use client";

import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";

// The form is already on this page. Back only closes it.
export function AddPanel({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-black/30 transition-colors hover:bg-black/50"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="text-2xl font-black tracking-tighter">{title}</h2>
      </div>
      {children}
    </div>
  );
}
