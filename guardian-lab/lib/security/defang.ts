/**
 * Guardian Lab: URL Defanger Utility
 * Converts active URLs into safe, non-clickable representations:
 * - Replaces `http://` with `hxxp://` and `https://` with `hxxps://`
 * - Replaces dots in the domain name with `[.]`
 * - Preserves URL path, search params, and hash fragments intact.
 */

/**
 * Defangs a URL or domain string.
 * Example: `https://secure-bca.phish-login.com` -> `hxxps://secure-bca[.]phish-login[.]com`
 */
export function defangUrl(input: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  const urlToParse = hasScheme ? trimmed : `http://${trimmed}`;

  try {
    const parsed = new URL(urlToParse);
    let protocol = parsed.protocol;
    if (hasScheme) {
      if (protocol === "http:") protocol = "hxxp:";
      else if (protocol === "https:") protocol = "hxxps:";
    }

    const defangedHost = parsed.hostname.replace(/\./g, "[.]");
    const portPart = parsed.port ? `:${parsed.port}` : "";
    const pathPart =
      parsed.pathname === "/" && !hasScheme && !trimmed.includes("/") ? "" : parsed.pathname;
    const searchPart = parsed.search;
    const hashPart = parsed.hash;

    if (hasScheme) {
      const finalPath = pathPart === "/" && !trimmed.endsWith("/") ? "" : pathPart;
      return `${protocol}//${defangedHost}${portPart}${finalPath}${searchPart}${hashPart}`;
    }

    return `${defangedHost}${portPart}${pathPart}${searchPart}${hashPart}`;
  } catch {
    // Fallback for non-standard URI formats
    return trimmed
      .replace(/^https:\/\//i, "hxxps://")
      .replace(/^http:\/\//i, "hxxp://")
      .replace(/\./g, "[.]");
  }
}

/**
 * Restores a defanged URL back to an active format.
 * Example: `hxxps://secure-bca[.]phish-login[.]com` -> `https://secure-bca.phish-login.com`
 */
export function refangUrl(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .trim()
    .replace(/^hxxps:\/\//i, "https://")
    .replace(/^hxxp:\/\//i, "http://")
    .replace(/\[\.\]/g, ".");
}

/**
 * Checks if a target string contains defanged indicators.
 */
export function isDefanged(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  return input.startsWith("hxxp://") || input.startsWith("hxxps://") || input.includes("[.]");
}
