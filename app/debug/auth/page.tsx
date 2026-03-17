import { getCurrentProfile, getRedirectPathForRole } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getProfileRoles, resolveActiveRole } from "@/lib/services/roles.service";
import { getHostByProfileId } from "@/lib/services/hosts.service";

export default async function DebugAuthPage() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const ctx = await getCurrentProfile();

  if (!ctx) {
    log.info("debug/auth: unauthenticated", { request_id: requestId });
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border border-(--color-card-border) bg-(--color-card) px-6 py-8 shadow-lg">
          <h1 className="text-xl font-semibold text-(--color-text-primary)">
            Auth debug
          </h1>
          <p className="mt-3 text-sm text-(--color-text-secondary)">
            You are not authenticated. Sign in first, then revisit this page.
          </p>
          <div className="mt-4 text-xs text-(--color-text-secondary)">
            <p>request_id: <code className="rounded bg-black/30 px-1 py-0.5">{requestId}</code></p>
          </div>
        </div>
      </main>
    );
  }

  const { user, profile } = ctx;
  const rolesRows = await getProfileRoles(profile.id);
  const availableRoles = rolesRows.map((r) => r.role);
  const effectiveRole = resolveActiveRole(profile.role, (profile as { active_role?: string | null }).active_role ?? null, availableRoles);
  const redirectPath = getRedirectPathForRole(effectiveRole);
  const siteUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL.trim()
      ? process.env.NEXT_PUBLIC_SITE_URL.trim()
      : undefined;

  const isAdmin = effectiveRole === "admin";
  const host = await getHostByProfileId(profile.id);

  log.info("debug/auth: profile inspected", {
    request_id: requestId,
    user_id: user.id,
    role: profile.role,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-16">
      <div className="w-full rounded-2xl border border-(--color-card-border) bg-(--color-card) px-6 py-8 shadow-lg">
        <h1 className="text-xl font-semibold text-(--color-text-primary)">
          Auth debug
        </h1>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Read-only diagnostics for the current session. Secrets and raw keys are never shown.
        </p>

        <section className="mt-6 space-y-3 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              Session
            </h2>
            <div className="mt-2 rounded-lg bg-black/20 px-4 py-3 text-xs text-(--color-text-primary)">
              <p>User ID: <code>{user.id}</code></p>
              <p>Email: <code>{user.email ?? "null"}</code></p>
              <p>Primary role: <code>{profile.role}</code></p>
              <p>Active/effective role: <code>{effectiveRole}</code></p>
              <p>Redirect path: <code>{redirectPath}</code></p>
              {availableRoles.length > 0 && (
                <p>
                  Available roles:{" "}
                  <code>{availableRoles.join(", ")}</code>
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              Host (marketplace)
            </h2>
            <div className="mt-2 rounded-lg bg-black/20 px-4 py-3 text-xs text-(--color-text-primary)">
              {host ? (
                <>
                  <p>Status: <span className="text-emerald-300">host profile active</span></p>
                  <p>Host ID: <code>{host.id}</code></p>
                  <p>Display name: <code>{host.display_name}</code></p>
                  <p>City: <code>{host.city ?? "—"}</code></p>
                  <p>WhatsApp: <code>{host.whatsapp ?? "—"}</code></p>
                </>
              ) : (
                <p className="text-(--color-text-secondary)">
                  No host entity found for this profile. Legacy experiences and non-host accounts are expected to have no host.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              Environment (safe)
            </h2>
            <div className="mt-2 rounded-lg bg-black/20 px-4 py-3 text-xs text-(--color-text-primary)">
              <p>request_id: <code>{requestId}</code></p>
              <p>host (NEXT_PUBLIC_SITE_URL): <code>{siteUrl ?? "(not set)"}</code></p>
              <p>NODE_ENV: <code>{process.env.NODE_ENV}</code></p>
            </div>
          </div>

          {!isAdmin ? (
            <p className="mt-2 text-xs text-(--color-text-secondary)">
              Detailed auth and cookie diagnostics are restricted to admin users.
            </p>
          ) : (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
                Admin diagnostics
              </h2>
              <p className="mt-1 text-xs text-(--color-text-secondary)">
                For admins, check server logs for full structured events related to this request_id
                (e.g. <code>auth/me</code>, <code>auth/callback</code>, and proxy logs).
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

