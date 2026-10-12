"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Google blocks sign-in inside the built-in browsers of chat and social apps.
function isInAppBrowser() {
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|Instagram|WhatsApp|Messenger|MicroMessenger|Line\/|TikTok|Snapchat|LinkedInApp/i.test(ua)) {
    return true;
  }
  // Android WebView
  if (/Android/.test(ua) && /; wv\)/.test(ua)) return true;
  // iOS WebView: real Safari / Chrome / Firefox on iOS all include "Safari/"
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua)) return true;
  return false;
}

const noop = () => () => {};

export function GoogleSignIn({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inApp = useSyncExternalStore(noop, isInAppBrowser, () => false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(location.href);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {inApp && (
        <div className="rounded-lg bg-amber-400/15 p-4 text-sm text-amber-200">
          <p className="font-medium">Please open this page in Chrome or Safari</p>
          <p className="mt-1">
            Google sign-in doesn&apos;t work inside this app&apos;s browser. Tap
            the ⋮ or ⋯ menu and choose &quot;Open in browser&quot;, or copy the
            link and paste it into Chrome / Safari.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={copyLink}>
            {copied ? "Link copied" : "Copy link"}
          </Button>
        </div>
      )}
      <Button size="lg" className="h-12 w-full text-base" onClick={signIn} disabled={loading}>
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
    </div>
  );
}
