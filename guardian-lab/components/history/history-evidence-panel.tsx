import { TechnicalEvidencePanel } from "@/components/shared/technical-evidence-panel";
import type { Investigation } from "@/lib/validations/investigation";

export function HistoryEvidencePanel({
  record,
  search,
  onSearchChange,
}: {
  record: Investigation;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <TechnicalEvidencePanel
      evidence={record.technicalEvidence}
      metadata={{
        status: record.status,
        analysisSource: record.analysisSource,
        modelVersion: record.modelVersion,
        errorCode: record.errorCode,
        inputMetadata: record.inputMetadata,
      }}
      search={search}
      onSearchChange={onSearchChange}
    />
  );
}
