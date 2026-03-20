import { getServerSupabase } from "@/lib/supabase/server";

export type Host = {
  id: string;
  profile_id: string;
  display_name: string;
  city: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_active: boolean;
  created_at: string;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_details_submitted?: boolean | null;
};

export async function getHostByProfileId(profileId: string): Promise<Host | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("hosts")
    .select(
      "id, profile_id, display_name, city, bio, phone, whatsapp, is_active, created_at, stripe_account_id, stripe_onboarding_complete, stripe_details_submitted",
    )
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Host;
}

export async function getHostById(hostId: string): Promise<Host | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("hosts")
    .select(
      "id, profile_id, display_name, city, bio, phone, whatsapp, is_active, created_at, stripe_account_id, stripe_onboarding_complete, stripe_details_submitted",
    )
    .eq("id", hostId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Host;
}

export type HostExperience = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  base_price_cents: number | null;
  city: string | null;
};

export async function getHostExperiences(hostId: string): Promise<HostExperience[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("experiences")
    .select("id, name, description, category, base_price_cents, city")
    .eq("host_id", hostId);

  if (error || !data) return [];
  return data as HostExperience[];
}

