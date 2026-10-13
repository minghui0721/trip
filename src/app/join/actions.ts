"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeInviteCode } from "@/lib/invite";

export type JoinTripState = { error?: string };

export async function joinTrip(
  _prev: JoinTripState,
  formData: FormData,
): Promise<JoinTripState> {
  const code = normalizeInviteCode(String(formData.get("code") ?? ""));
  if (!code) return { error: "This invite link isn't valid." };

  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);

  const { data: tripId, error } = await supabase.rpc("join_trip", { p_code: code });
  if (error || !tripId) {
    if (error?.message.includes("invite not found") || error?.code === "P0002") {
      return { error: "This invite link isn't valid." };
    }
    return { error: "Couldn't join this trip. Please try again." };
  }

  redirect(`/trips/${tripId}`);
}
