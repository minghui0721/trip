import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

export type Person = { display_name: string; avatar_url: string | null };

// Overlapping avatars, e.g. (M)(J)(A)+2
export function AvatarStack({
  people,
  max = 4,
  className,
}: {
  people: Person[];
  max?: number;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className={cn("flex -space-x-2", className)}>
      {shown.map((p, i) => (
        <Avatar
          key={i}
          name={p.display_name}
          url={p.avatar_url}
          className="size-7 bg-black/35 text-xs text-white ring-2 ring-black/40"
        />
      ))}
      {extra > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-black/50 text-xs font-bold ring-2 ring-black/40">
          +{extra}
        </span>
      )}
    </div>
  );
}
