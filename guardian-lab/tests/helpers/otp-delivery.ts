import { parsePhoneNumberFromString } from "libphonenumber-js";

const deliveredCodes = new Map<string, string>();

export function normalizeTestPhone(phone: string): string {
  return (
    parsePhoneNumberFromString(phone, { defaultCountry: "ID", extract: false })?.number ?? phone
  );
}

export function recordOtpDelivery(phone: string, code: string): void {
  deliveredCodes.set(normalizeTestPhone(phone), code);
}

export function getOtpCode(phone: string): string {
  return deliveredCodes.get(normalizeTestPhone(phone)) ?? "";
}

export function clearOtpDeliveries(): void {
  deliveredCodes.clear();
}
