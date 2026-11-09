"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react";
import styles from "../auth.module.css";

type AuthFieldProps = Omit<ComponentPropsWithoutRef<"input">, "id" | "className" | "children"> & {
  id: string;
  label: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
};

export function AuthField({
  id,
  label,
  error,
  startAdornment,
  endAdornment,
  ...inputProps
}: AuthFieldProps) {
  const description =
    [error ? `${id}-error` : undefined, inputProps["aria-describedby"]].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}
        {inputProps.required && (
          <>
            <span className={styles.required} aria-hidden="true">
              {" "}
              *
            </span>
            <span className="sr-only"> (wajib)</span>
          </>
        )}
      </label>
      <div
        className={styles.inputShell}
        data-invalid={Boolean(error)}
        data-disabled={Boolean(inputProps.disabled)}
      >
        {startAdornment && (
          <span className={styles.inputIcon} aria-hidden="true">
            {startAdornment}
          </span>
        )}
        <input
          {...inputProps}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={description}
          className={styles.input}
        />
        {endAdornment}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = Omit<AuthFieldProps, "type" | "endAdornment">;

export function AuthPasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <AuthField
      {...props}
      type={visible ? "text" : "password"}
      startAdornment={props.startAdornment ?? <LockKeyhole />}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          onMouseDown={(event) => event.preventDefault()}
          disabled={props.disabled}
          className={styles.passwordToggle}
          aria-pressed={visible}
          aria-label={
            visible
              ? `Sembunyikan ${props.label.toLowerCase()}`
              : `Lihat ${props.label.toLowerCase()}`
          }
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      }
    />
  );
}
