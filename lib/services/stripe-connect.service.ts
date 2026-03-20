import Stripe from "stripe";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2026-02-25.clover";

function getStripeClient(): Stripe {
  const config = getServerConfig();
  if (!config.STRIPE_SECRET_KEY) {
    throw new Error("Stripe not configured");
  }
  return new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
}

export async function createOrGetHostStripeAccount(hostId: string): Promise<string> {
  const supabase = getServerSupabase();
  const { data: host, error } = await supabase
    .from("hosts")
    .select("id, stripe_account_id, display_name, city")
    .eq("id", hostId)
    .maybeSingle();

  if (error || !host) {
    throw new Error("Host not found");
  }

  if (host.stripe_account_id) {
    return host.stripe_account_id as string;
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.create({
    type: "express",
    business_type: "individual",
    metadata: { host_id: hostId },
  });

  await supabase
    .from("hosts")
    .update({ stripe_account_id: account.id })
    .eq("id", hostId);

  return account.id;
}

export async function createHostOnboardingLink(hostId: string, returnUrl: string, refreshUrl: string): Promise<string> {
  const stripe = getStripeClient();
  const accountId = await createOrGetHostStripeAccount(hostId);
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return link.url;
}

export async function refreshStripeAccountStatusForHost(hostId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { data: host, error } = await supabase
    .from("hosts")
    .select("id, stripe_account_id")
    .eq("id", hostId)
    .maybeSingle();

  if (error || !host || !host.stripe_account_id) return;

  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(host.stripe_account_id);

  const detailsSubmitted = !!(account as Stripe.Account).details_submitted;
  const payoutsEnabled = !!(account as Stripe.Account).payouts_enabled;

  await supabase
    .from("hosts")
    .update({
      stripe_details_submitted: detailsSubmitted,
      stripe_onboarding_complete: payoutsEnabled,
    })
    .eq("id", hostId);
}

export async function createOrGetSpecialistStripeAccount(specialistId: string): Promise<string> {
  const supabase = getServerSupabase();
  const { data: specialist, error } = await supabase
    .from("specialists")
    .select("id, stripe_account_id")
    .eq("id", specialistId)
    .maybeSingle();

  if (error || !specialist) {
    throw new Error("Specialist not found");
  }

  if (specialist.stripe_account_id) {
    return specialist.stripe_account_id as string;
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.create({
    type: "express",
    business_type: "individual",
    metadata: { specialist_id: specialistId },
  });

  await supabase
    .from("specialists")
    .update({ stripe_account_id: account.id })
    .eq("id", specialistId);

  return account.id;
}

export async function createSpecialistOnboardingLink(
  specialistId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<string> {
  const stripe = getStripeClient();
  const accountId = await createOrGetSpecialistStripeAccount(specialistId);
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return link.url;
}

export async function refreshStripeAccountStatusForSpecialist(specialistId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { data: specialist, error } = await supabase
    .from("specialists")
    .select("id, stripe_account_id")
    .eq("id", specialistId)
    .maybeSingle();

  if (error || !specialist || !specialist.stripe_account_id) return;

  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(specialist.stripe_account_id);

  const detailsSubmitted = !!(account as Stripe.Account).details_submitted;
  const payoutsEnabled = !!(account as Stripe.Account).payouts_enabled;

  await supabase
    .from("specialists")
    .update({
      stripe_details_submitted: detailsSubmitted,
      stripe_onboarding_complete: payoutsEnabled,
    })
    .eq("id", specialistId);
}

