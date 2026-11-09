import { URL_MODEL_NOTICE, type UrlModelEvidence } from "@/lib/validations/guardian-ml";

export function UrlModelNotice({ model }: { model?: UrlModelEvidence }) {
  if (!model) return null;
  return (
    <aside
      aria-label="Batas hasil model AI"
      className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p className="font-semibold">Perlu verifikasi</p>
      <p>{URL_MODEL_NOTICE}</p>
      <p className="text-xs">Model masih dikembangkan untuk riset nonkomersial.</p>
    </aside>
  );
}
