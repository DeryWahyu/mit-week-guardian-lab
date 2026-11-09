"use client";

import { useState } from "react";
import workspace from "@/components/workspace/workspace.module.css";
import { explainPermission } from "@/lib/apk/presentation";

export function ApkPermissionList({ permissions }: { permissions: string[] }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visible = permissions.filter((permission) =>
    `${permission} ${explainPermission(permission)}`.toLowerCase().includes(query),
  );
  return (
    <div className="space-y-3">
      <label className={workspace.label}>
        Cari izin (Opsional)
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau kemampuan izin…"
          className={`${workspace.field} mt-2`}
        />
      </label>
      <p className="text-xs text-slate-500" aria-live="polite">
        {visible.length} dari {permissions.length} izin
      </p>
      <div className="max-h-80 space-y-2 overflow-auto">
        {visible.map((permission) => (
          <div key={permission} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="text-slate-700">{explainPermission(permission)}</p>
            <code className="mt-1 block text-xs break-all text-slate-500">{permission}</code>
          </div>
        ))}
        {!visible.length && (
          <p className={workspace.notice}>Tidak ada izin yang cocok. Ubah kata pencarianmu.</p>
        )}
      </div>
    </div>
  );
}
