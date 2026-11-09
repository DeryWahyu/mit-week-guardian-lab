"use client";

import { ImagePlus, RotateCcw, Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AcademyTopicArt } from "@/components/academy/academy-topic-art";
import { THUMBNAIL_ACCEPT, thumbnailFileProblem } from "@/lib/academy/thumbnail-config";
import { cn } from "@/lib/utils";
import type { QuizInput } from "@/lib/validations/academy";
import styles from "./quiz-thumbnail.module.css";

export function QuizThumbnailField({
  category,
  savedUrl,
  file,
  change,
  disabled,
}: {
  category: QuizInput["category"];
  savedUrl?: string | null;
  file: File | null | undefined;
  change: (file: File | null | undefined) => void;
  disabled: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const url = file
    ? preview?.file === file
      ? preview.url
      : null
    : file === null
      ? null
      : savedUrl;
  function select(files: File[]) {
    if (disabled || !files.length) return;
    const problem =
      files.length > 1 ? "Pilih satu gambar untuk thumbnail." : thumbnailFileProblem(files[0]);
    setError(problem);
    if (problem) {
      input.current?.focus();
      return;
    }
    change(files[0]);
  }
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        Thumbnail latihan (Opsional)
      </label>
      <p id={`${id}-help`} className={styles.help}>
        Tampil pada kartu latihan di halaman Belajar. JPG, PNG, atau WebP, maksimal 5 MB dan 16
        megapiksel. Disarankan rasio 2:1.
      </p>
      <fieldset
        disabled={disabled}
        aria-label="Unggah thumbnail latihan"
        className={cn(styles.dropZone, dragging && styles.dragging)}
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
          select(Array.from(event.dataTransfer.files));
        }}
      >
        <input
          ref={input}
          id={id}
          type="file"
          accept={THUMBNAIL_ACCEPT}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
          className={styles.input}
          onChange={(event) => {
            select(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <label htmlFor={id} className={styles.picker}>
          <span className={styles.preview}>
            <AcademyTopicArt
              category={category}
              thumbnailUrl={url}
              sizes="(max-width: 600px) 80vw, 320px"
            />
          </span>
          <span className={styles.instructions}>
            <span className={styles.icon}>
              <ImagePlus aria-hidden="true" size={23} />
            </span>
            <strong>{file || savedUrl ? "Ganti thumbnail" : "Pilih thumbnail latihan"}</strong>
            <span>Tarik gambar ke sini atau pilih dari perangkat.</span>
            <span className={styles.choose}>
              <Upload aria-hidden="true" size={16} />
              Pilih gambar
            </span>
          </span>
        </label>
      </fieldset>
      <div className={styles.selection}>
        <p>
          {file
            ? file.name
            : file === null
              ? "Ilustrasi kategori akan digunakan setelah disimpan."
              : savedUrl
                ? "Thumbnail tersimpan."
                : "Menggunakan ilustrasi kategori bawaan."}
        </p>
        <div className={styles.actions}>
          {(file || (savedUrl && file !== null)) && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setError(null);
                change(null);
              }}
            >
              <X aria-hidden="true" size={15} />
              Hapus thumbnail
            </button>
          )}
          {savedUrl && file !== undefined && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setError(null);
                change(undefined);
              }}
            >
              <RotateCcw aria-hidden="true" size={15} />
              Batal perubahan gambar
            </button>
          )}
        </div>
      </div>
      <p className={styles.help}>
        Gambar dipotong dari tengah agar pas dengan kartu. Perubahan diterapkan saat kuis disimpan.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className={styles.error}>
          {error} Berkas ini tidak digunakan.
        </p>
      )}
    </div>
  );
}
