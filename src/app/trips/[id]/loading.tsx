export default function TripLoading() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <p className="sr-only">Loading trip</p>
      <header className="bg-gradient-to-b from-secondary to-background px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-6 md:px-8 md:pt-8">
        <div className="mx-auto w-full max-w-md animate-pulse md:max-w-5xl">
          <div className="size-9 rounded-full bg-white/15" />
          <div className="mt-16 h-3 w-10 rounded bg-white/20 md:mt-24" />
          <div className="mt-3 h-12 w-3/5 rounded-lg bg-white/20" />
          <div className="mt-4 h-4 w-2/5 rounded bg-white/15" />
        </div>
      </header>
      <div className="border-b border-white/10 px-5 md:px-8">
        <div className="mx-auto flex w-full max-w-md gap-2 py-3 md:max-w-5xl">
          <div className="h-9 w-24 animate-pulse rounded-full bg-white/15" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-white/10" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-5 py-6 md:max-w-5xl md:px-8">
        <div className="h-7 w-28 animate-pulse rounded bg-white/15" />
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
      </main>
    </div>
  );
}
