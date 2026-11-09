import type { InvestigationSubmitOptions } from "@/lib/hooks/use-investigation-submit";

export interface AnalysisGatewayProps extends InvestigationSubmitOptions {
  defaultTab?: "url" | "qr";
  className?: string;
  onInputChange?: () => void;
}
