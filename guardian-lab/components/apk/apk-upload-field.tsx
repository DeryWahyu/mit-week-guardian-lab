"use client";

import { Folder, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ApkFileIcon } from "@/components/shared/apk-icons";
import { cn } from "@/lib/utils";
import styles from "./apk-workspace.module.css";

export function ApkUploadField({
  file,
  error,
  disabled,
  onSelect,
  onClear,
}: {
  file: File | null;
  error: string | null;
  disabled: boolean;
  onSelect: (files: File[]) => void;
  onClear: () => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (error) buttonRef.current?.focus();
  }, [error]);
  return (
    <div className={styles.uploadField}>
      <label htmlFor={id} className={styles.fieldLabel}>
        File Android (.apk) <span aria-hidden="true">*</span>
        <span className="sr-only"> (wajib)</span>
      </label>
      <fieldset
        disabled={disabled}
        aria-label="Unggah berkas APK"
        className={cn(styles.dropzone, dragging && styles.dragging, error && styles.invalid)}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) onSelect(Array.from(event.dataTransfer.files));
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept=".apk"
          disabled={disabled}
          tabIndex={-1}
          className="sr-only"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-help ${id}-error` : `${id}-help`}
          onChange={(event) => {
            if (event.target.files?.length) onSelect(Array.from(event.target.files));
            event.target.value = "";
          }}
        />
        {file ? (
          <div className={styles.selectedFile}>
            <ApkFileIcon className={styles.selectedIcon} />
            <div>
              <p>{file.name}</p>
              <span>
                {(file.size / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 2 })} MB
              </span>
            </div>
            <button
              type="button"
              disabled={disabled}
              className={styles.clearButton}
              aria-label="Hapus berkas APK"
              onClick={() => {
                onClear();
                buttonRef.current?.focus();
              }}
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        ) : (
          <>
            <ApkFileIcon className={styles.dropIcon} />
            <strong>Tarik file APK ke sini</strong>
            <span className={styles.or}>atau</span>
          </>
        )}
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          className={styles.chooseButton}
          onClick={() => inputRef.current?.click()}
          aria-label={file ? "Ganti file APK" : "Pilih file APK"}
          aria-describedby={error ? `${id}-help ${id}-error` : `${id}-help`}
        >
          <Folder aria-hidden="true" size={17} />
          {file ? "Ganti file" : "Pilih file"}
        </button>
        <span id={`${id}-help`} className={styles.fileLimit}>
          .apk · maksimal 50 MB
        </span>
      </fieldset>
      {error && (
        <p id={`${id}-error`} role="alert" className={styles.fileError}>
          {error}
        </p>
      )}
    </div>
  );
}
