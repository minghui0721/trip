import { GoogleSignIn } from "@/components/google-sign-in";
import { Logo } from "@/components/logo";

// What signed-out visitors see at "/".
export function Landing() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Colour glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[10svh] left-1/2 h-[34rem] w-[48rem] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.6 0.2 300), oklch(0.65 0.18 25) 55%, transparent)",
        }}
      />

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-6">
        {/* Hero fills the first screen */}
        <section className="flex min-h-lvh flex-col items-center justify-center gap-8 px-0 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] text-center">
          <Logo className="text-2xl" />
          <h1 className="text-5xl leading-[0.9] font-black tracking-tighter sm:text-8xl">
            Plan your trip
            <br />
            <span className="text-primary">together.</span>
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            One place for your group: who&apos;s coming, where you&apos;re going,
            and when. Share one link and everyone sees the same trip.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <GoogleSignIn next="/" />
            <p className="text-sm text-muted-foreground">
              Free · Nothing to install
            </p>
          </div>
        </section>

        {/* Below the fold, for anyone who scrolls */}
        <section className="flex flex-col gap-6 pb-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">How it works</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            <Step n={1} title="Create a trip" body="Give it a name, a destination and dates. Vietnam 2026, done." />
            <Step n={2} title="Share the invite link" body="Drop it in your group chat. Friends sign in with Google and they're in." />
            <Step n={3} title="Everyone's in sync" body="No more scrolling back through the chat to find the plan." />
          </ol>
        </section>
      </main>

      <footer className="relative py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-sm text-muted-foreground">
        Made for trips with friends.
      </footer>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4 rounded-xl bg-card p-5 text-left transition-colors hover:bg-secondary sm:flex-col">
      <span className="text-4xl leading-none font-black text-primary">{n}</span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
