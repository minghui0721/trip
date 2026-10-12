"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

const noop = () => () => {};

export function InviteLink({ code, tripName }: { code: string; tripName: string }) {
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(noop, () => location.origin, () => "");
  const canShare = useSyncExternalStore(
    noop,
    () => typeof navigator.share === "function",
    () => false,
  );
  const path = `/join/${code}`;
  const url = origin ? `${origin}${path}` : path;

  async function copy() {
    await navigator.clipboard.writeText(origin ? url : `${location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    const shareUrl = origin ? url : `${location.origin}${path}`;
    try {
      await navigator.share({
        title: tripName,
        text: `Join ${tripName} on Jalan Jalan`,
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="truncate rounded-md bg-background px-3 py-2 font-mono text-sm text-muted-foreground">
        {url}
      </p>
      <div className="flex gap-2">
        {canShare && (
          <Button type="button" className="h-10 flex-1" onClick={share}>
            <Share /> Share link
          </Button>
        )}
        <Button
          type="button"
          variant={canShare ? "outline" : "default"}
          className="h-10 flex-1"
          onClick={copy}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}
