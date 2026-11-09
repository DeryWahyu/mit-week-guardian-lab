import { isIP } from "node:net";
import { InputError } from "@/lib/investigations/request-input";
import { hasPii } from "@/lib/security/pii-scrubber";
export function sandboxTarget(input: string | undefined, stripParameters = false) {
  if (!input) throw new InputError("Masukkan tautan yang ingin dibuka.");
  const url = new URL(input);
  if ((url.search || url.hash) && !stripParameters)
    throw new InputError(
      "Tautan memiliki parameter atau fragmen. Setujui penghapusannya sebelum membuka versi tanpa parameter.",
    );
  if (url.port && !["80", "443"].includes(url.port))
    throw new InputError("Sandbox hanya mendukung port web 80 dan 443.");
  // The egress proxy also enforces destination IP checks after DNS resolution and redirects.
  if (
    isIP(url.hostname.replace(/[[\]]/g, "")) ||
    !url.hostname.includes(".") ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/i.test(url.hostname)
  )
    throw new InputError("Gunakan domain publik. Alamat jaringan lokal tidak diizinkan.");
  let path = url.pathname;
  try {
    for (let i = 0; i < 3; i++) path = decodeURIComponent(path);
  } catch {
    /* The normalized URL remains valid. */
  }
  if (hasPii(path))
    throw new InputError("Hapus data pribadi dari jalur tautan sebelum membuka sandbox.");
  url.search = "";
  url.hash = "";
  return url.href;
}
