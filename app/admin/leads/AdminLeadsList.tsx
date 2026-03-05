"use client";

import Link from "next/link";

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
};

type Props = { initialLeads: Lead[] };

export default function AdminLeadsList({ initialLeads }: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {initialLeads.map((lead) => (
            <tr key={lead.id} className="border-b border-zinc-100">
              <td className="px-4 py-3">{lead.first_name} {lead.last_name}</td>
              <td className="px-4 py-3">{lead.email}</td>
              <td className="px-4 py-3">{lead.status}</td>
              <td className="px-4 py-3">{new Date(lead.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/leads/${lead.id}`} className="text-emerald-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {initialLeads.length === 0 && (
        <p className="p-8 text-center text-zinc-500">No leads yet.</p>
      )}
    </div>
  );
}
