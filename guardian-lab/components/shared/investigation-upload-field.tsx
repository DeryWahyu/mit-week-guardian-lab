"use client";
import { FileCode2, ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./investigation-upload.module.css";

export function InvestigationUploadField({
  type,
  file,
  preview,
  error,
  disabled,
  onSelect,
  onClear,
}: {
  type: "qr" | "apk";
  file: File | null;
  preview?: string | null;
  error: string | null;
  disabled: boolean;
  onSelect: (files: File[]) => void;
  onClear: () => void;
}) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const qr = type === "qr";
  const Icon = qr ? ImageIcon : FileCode2;
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block text-xs font-bold text-slate-700">
        {qr ? "Gambar kode QR" : "File aplikasi Android (.apk)"}{" "}
        <span className="text-rose-600" aria-hidden="true">
          *
        </span>
        <span className="sr-only">(wajib)</span>
      </label>
      <fieldset
        disabled={disabled}
        aria-label={qr ? "Unggah gambar QR" : "Unggah berkas APK"}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) onSelect(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "relative min-w-0 rounded-2xl border-2 border-dashed p-5",
          styles.upload,
          error
            ? "border-rose-400 bg-rose-50/30"
            : dragging
              ? styles.uploadDragging
              : "border-slate-300 bg-slate-50/40",
          disabled && "opacity-60",
        )}
      >
        <input
          id={id}
          type="file"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-help ${id}-error` : `${id}-help`}
          accept={qr ? "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" : ".apk"}
          className="peer sr-only"
          onChange={(event) => {
            if (event.target.files?.length) onSelect(Array.from(event.target.files));
            event.target.value = "";
          }}
        />
        <label
          htmlFor={id}
          className={cn(
            "flex flex-col items-center gap-2 text-center",
            disabled ? "cursor-wait" : "cursor-pointer",
          )}
        >
          {file ? (
            <Icon className="size-7 text-slate-600" aria-hidden="true" />
          ) : (
            <Upload className="size-7 text-slate-500" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold text-slate-800">
            {file ? "Ganti berkas" : "Pilih atau tarik berkas ke sini"}
          </span>
          {!file && (
            <span className="text-xs text-slate-500">
              {qr ? "PNG, JPG, WebP · maksimal 5 MB" : ".apk · maksimal 50 MB"}
            </span>
          )}
        </label>
        {file && (
          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            {preview && (
              <Image
                src={preview}
                alt="Pratinjau kode QR"
                width={48}
                height={48}
                unoptimized
                className="size-12 shrink-0 rounded-lg object-contain"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} KB
              </p>
            </div>
            <button
              type="button"
              disabled={disabled}
              aria-label={qr ? "Hapus gambar QR" : "Hapus berkas APK"}
              onClick={onClear}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-wait"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </fieldset>
      <p id={`${id}-help`} className="text-xs text-slate-500">
        {qr
          ? "Gambar harus memuat satu kode QR yang jelas dan utuh. Isi tautannya dibaca tanpa dibuka di perangkat."
          : "Manifest, izin, dan kode diperiksa secara statis tanpa menjalankan APK."}
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
