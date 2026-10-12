import { cn } from "@/lib/utils";

// Google photo if there is one, otherwise the first letter of the name.
export function Avatar({
  name,
  url,
  className,
}: {
  name: string;
  url: string | null;
  className?: string;
}) {
  const base = "size-10 shrink-0 rounded-full";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={cn(base, className)} referrerPolicy="no-referrer" />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(base, "flex items-center justify-center bg-secondary font-bold text-foreground", className)}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
