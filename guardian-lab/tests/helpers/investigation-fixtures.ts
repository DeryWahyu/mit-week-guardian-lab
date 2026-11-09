import { readFileSync } from "node:fs";

export function apkUpload(
  fileName = "fixture.apk",
  content: BlobPart = readFileSync(new URL("../fixtures/apk/resources-only.apk", import.meta.url)),
) {
  const form = new FormData();
  form.set(
    "file",
    new File([content], fileName, { type: "application/vnd.android.package-archive" }),
  );
  return form;
}
