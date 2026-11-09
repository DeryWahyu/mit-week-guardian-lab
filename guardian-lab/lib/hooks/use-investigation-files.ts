"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apkMetadataSchema, qrFileSchema } from "@/lib/validations/analysis-input";

export function useInvestigationFiles() {
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ qr: string | null; apk: string | null }>({
    qr: null,
    apk: null,
  });
  useEffect(() => {
    if (!qrFile) {
      setQrPreview(null);
      return;
    }
    const preview = URL.createObjectURL(qrFile);
    setQrPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [qrFile]);

  function selectFiles(type: "qr" | "apk", files: File[]) {
    const file = files[0];
    const result =
      type === "qr"
        ? qrFileSchema.safeParse(file && { name: file.name, size: file.size, type: file.type })
        : apkMetadataSchema.safeParse(file && { fileName: file.name, fileSizeBytes: file.size });
    const error =
      files.length !== 1
        ? "Pilih satu berkas untuk setiap pemeriksaan."
        : !result.success
          ? (result.error.issues[0]?.message ?? "Berkas tidak valid.")
          : null;
    setErrors((previous) => ({ ...previous, [type]: error }));
    if (type === "qr") setQrFile(error ? null : file);
    else setApkFile(error ? null : file);
    if (error) toast.error(error);
  }
  function clearFile(type: "qr" | "apk") {
    if (type === "qr") setQrFile(null);
    else setApkFile(null);
    setErrors((previous) => ({ ...previous, [type]: null }));
  }
  return { qrFile, apkFile, qrPreview, errors, selectFiles, clearFile };
}
