import { GoogleSignIn } from "@/components/google-sign-in";
import { Logo } from "@/components/logo";

// What signed-out visitors see at "/".
export function Landing() {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      {/* Colour glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-16 left-1/2 h-[34rem] w-[48rem] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.6 0.2 300), oklch(0.65 0.18 25) 55%, transparent)",
        }}
      />

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-6">
        {/* Hero fills the first screen */}
        <section className="flex flex-1 flex-col items-center justify-center gap-8 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
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
      </main>

      <footer className="relative py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-sm text-muted-foreground">
        Made for trips with friends.
      </footer>
    </div>
  );
}
