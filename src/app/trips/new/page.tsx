import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { CreateTripForm } from "./create-trip-form";

export default async function NewTripPage() {
  await requireUser("/trips/new");

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-40%">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-12 md:max-w-lg md:pt-12">
        <Link
          href="/"
          aria-label="Back to your trips"
          className="-ml-1 flex size-9 items-center justify-center rounded-full bg-black/30 transition-colors hover:bg-black/50"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-4xl font-black tracking-tighter md:text-5xl">New trip</h1>
        <CreateTripForm />
      </main>
    </div>
  );
}
