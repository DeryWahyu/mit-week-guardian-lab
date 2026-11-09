import { XMLParser, XMLValidator } from "fast-xml-parser";
import { sanitizeInvestigationText } from "@/lib/investigations/privacy";
import { apkManifestSchema } from "@/lib/validations/apk-static";
import { ApkExtractionError } from "./limits";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown) {
  return typeof value === "string" && value
    ? sanitizeInvestigationText(value)
        .replace(/[\p{Cc}\p{Cf}]/gu, " ")
        .slice(0, 512)
    : null;
}
function flag(value: unknown) {
  return value === "true" ? true : value === "false" ? false : null;
}

export function parseApkManifest(xml: string, stringsXml?: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true)
    throw new ApkExtractionError(
      "APK_MANIFEST_INVALID",
      "Manifest APK tidak dapat dibaca dengan aman.",
    );
  const document: unknown = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: false,
    parseTagValue: false,
    processEntities: false,
    removeNSPrefix: true,
  }).parse(xml);
  const root = object(object(document).manifest);
  if (typeof root.package !== "string" || !/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$/.test(root.package))
    throw new ApkExtractionError(
      "APK_MANIFEST_INVALID",
      "Manifest APK tidak memiliki identitas paket yang valid.",
    );
  const app = object(root.application),
    sdk = object(root["uses-sdk"]);
  let label = text(app.label);
  if (
    label?.startsWith("@string/") &&
    stringsXml &&
    !/<!DOCTYPE|<!ENTITY/i.test(stringsXml) &&
    XMLValidator.validate(stringsXml) === true
  ) {
    const resources: unknown = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      processEntities: false,
      parseTagValue: false,
    }).parse(stringsXml);
    const strings = object(object(resources).resources).string;
    const values = Array.isArray(strings) ? strings : [strings];
    const value = values.find((item) => object(item).name === label?.slice(8));
    label = text(object(value)["#text"]) ?? label;
  }
  const permissions = [root["uses-permission"], root["uses-permission-sdk-23"]]
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((value) => object(value).name)
    .filter((value): value is string => typeof value === "string")
    .filter((value) => /^[a-zA-Z0-9_.]+$/.test(value));
  if (permissions.length > 1000)
    throw new ApkExtractionError(
      "APK_MANIFEST_LIMIT",
      "Jumlah deklarasi izin melebihi batas pemeriksaan.",
    );
  return apkManifestSchema.parse({
    packageName: text(root.package),
    versionName: text(root.versionName),
    versionCode: text(root.versionCode),
    minSdk: text(sdk.minSdkVersion),
    targetSdk: text(sdk.targetSdkVersion),
    label,
    debuggable: flag(app.debuggable),
    allowBackup: flag(app.allowBackup),
    usesCleartextTraffic: flag(app.usesCleartextTraffic),
    permissions: [...new Set(permissions)],
  });
}
