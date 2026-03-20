"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TreatmentProgressTimeline from "@/app/components/dashboard/TreatmentProgressTimeline";
import SpecialistProgressUpdateForm from "@/app/components/dashboard/SpecialistProgressUpdateForm";
import type { ProgressItem } from "@/app/components/dashboard/TreatmentProgressTimeline";

type ProgressRow = ProgressItem & { lead_id?: string | null };

type Props = Readonly<{ leadId: string }>;

export default function SpecialistProgressClient({ leadId }: Props) {
  const [list, setList] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/clinical/progress");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setList(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const forLead = list.filter((r) => r.lead_id === leadId);

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600">
        Lead: <span className="font-mono">{leadId.slice(0, 8)}…</span>{" "}
        <Link href="/specialist" className="text-emerald-600 hover:underline">
          ← Back to cases
        </Link>
      </p>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <TreatmentProgressTimeline
            items={forLead}
            emptyMessage="No progress entries for this case yet. Add one below."
          />
          <SpecialistProgressUpdateForm leadId={leadId} onSuccess={fetchProgress} />
        </>
      )}
    </div>
  );
}
