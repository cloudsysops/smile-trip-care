import { redirect } from "next/navigation";

/**
 * Admin login URL: redirect to canonical login preserving ?next= for post-login redirect.
 */
export default async function AdminLoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next ?? "/admin";
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
