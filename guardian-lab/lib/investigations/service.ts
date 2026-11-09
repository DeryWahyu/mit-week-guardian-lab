import type { ForensicRecord, InvestigationStatus, Prisma, ScanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type InvestigationResult,
  investigationResultSchema,
} from "@/lib/validations/investigation";
import { defangTarget, sanitizeEvidence, sanitizeInvestigationText } from "./privacy";

type Database = Prisma.TransactionClient;
export const MODEL_UNAVAILABLE_MESSAGE =
  "Input tersimpan. Model analisis belum tersedia, sehingga tingkat risiko belum dapat ditentukan.";

export function createInvestigation(
  input: {
    userId: string;
    target: string;
    type: ScanType;
    inputMetadata?: Prisma.InputJsonObject;
  },
  database: Database = prisma,
) {
  const target = sanitizeInvestigationText(input.target);
  return database.forensicRecord.create({
    data: {
      userId: input.userId,
      target,
      defangedTarget: defangTarget(target),
      type: input.type,
      status: "RECEIVED",
      inputMetadata: sanitizeEvidence(input.inputMetadata ?? {}),
    },
  });
}

const allowedFrom: Record<Exclude<InvestigationStatus, "RECEIVED">, InvestigationStatus[]> = {
  PROCESSING: ["RECEIVED"],
  COMPLETED: ["PROCESSING"],
  FAILED: ["RECEIVED", "PROCESSING"],
  UNAVAILABLE: ["RECEIVED", "PROCESSING"],
};

/** Internal worker/service operation. Status and findings are never accepted from public clients. */
export async function transitionInvestigation(
  input: { id: string; userId: string } & (
    | { status: "PROCESSING" }
    | { status: "COMPLETED"; result: InvestigationResult }
    | { status: "FAILED" | "UNAVAILABLE"; errorCode: string; errorMessage: string }
  ),
  database: Database = prisma,
): Promise<ForensicRecord> {
  const data: Prisma.ForensicRecordUpdateManyMutationInput = { status: input.status };
  if (input.status === "PROCESSING") data.startedAt = new Date();
  else data.finishedAt = new Date();
  if (input.status === "COMPLETED") {
    const result = investigationResultSchema.parse({
      ...input.result,
      summary: sanitizeInvestigationText(input.result.summary),
      deceptionTricks: input.result.deceptionTricks.map(sanitizeInvestigationText),
      technicalEvidence: sanitizeEvidence(input.result.technicalEvidence),
    });
    Object.assign(data, result, {
      errorCode: null,
      errorMessage: null,
    });
  } else if (input.status !== "PROCESSING") {
    data.errorCode = input.errorCode.slice(0, 191);
    data.errorMessage = sanitizeInvestigationText(input.errorMessage).slice(0, 2000);
  }
  const changed = await database.forensicRecord.updateMany({
    where: { id: input.id, userId: input.userId, status: { in: allowedFrom[input.status] } },
    data,
  });
  if (changed.count !== 1)
    throw new Error("Investigasi tidak ditemukan atau transisi status tidak diizinkan.");
  return database.forensicRecord.findUniqueOrThrow({ where: { id: input.id } });
}

/** Atomic persistence: a successful response always refers to a committed row. */
export function receiveUnavailableInvestigation(input: Parameters<typeof createInvestigation>[0]) {
  return prisma.$transaction(async (database) => {
    const record = await createInvestigation(input, database);
    return transitionInvestigation(
      {
        id: record.id,
        userId: record.userId,
        status: "UNAVAILABLE",
        errorCode: "MODEL_NOT_CONFIGURED",
        errorMessage: MODEL_UNAVAILABLE_MESSAGE,
      },
      database,
    );
  });
}

export function receiveFailedInvestigation(
  input: Parameters<typeof createInvestigation>[0],
  errorCode: string,
  errorMessage: string,
) {
  return prisma.$transaction(async (database) => {
    const record = await createInvestigation(input, database);
    return transitionInvestigation(
      { id: record.id, userId: record.userId, status: "FAILED", errorCode, errorMessage },
      database,
    );
  });
}
