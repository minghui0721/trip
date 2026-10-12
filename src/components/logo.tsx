import { cn } from "@/lib/utils";

// Paper plane with a dotted flight path.
// The same drawing lives in src/app/icon.svg and public/icons/ — update both.
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="100" height="100" rx="24" fill="#121212" />
      <path
        d="M16 70 Q 30 86 46 74"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="1 9"
        opacity=".7"
      />
      <path d="M20 50 L84 20 L64 80 L50 58 Z" fill="var(--primary)" />
      <path d="M50 58 L84 20" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// Icon + "Jalan Jalan".
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-black tracking-tight", className)}>
      <LogoIcon className="size-[1.6em] rounded-[0.4em] ring-1 ring-white/10" />
      Jalan Jalan
    </span>
  );
}
