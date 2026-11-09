import Link from "next/link";
import { PROTECTED_ROUTES } from "@/lib/routes";

export function InvestigationRequestFeedback({
  error,
  uncertain,
}: {
  error: string | null;
  uncertain: boolean;
}) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mt-4 space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
    >
      <p>{error}</p>
      {uncertain && (
        <Link
          href={PROTECTED_ROUTES.history}
          className="inline-flex min-h-11 items-center font-semibold underline"
        >
          Periksa riwayat investigasi
        </Link>
      )}
    </div>
  );
}
