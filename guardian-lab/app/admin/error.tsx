"use client";

import { AlertCircle } from "lucide-react";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-8" role="alert">
      <AlertCircle className="text-brand-600 mb-4 size-7" />
      <h2 className="text-lg font-semibold">Dashboard belum dapat dimuat</h2>
      <p className="mt-2 text-sm text-slate-500">
        Terjadi gangguan saat mengambil data. Silakan coba kembali.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600 mt-5 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Coba lagi
      </button>
    </div>
  );
}
