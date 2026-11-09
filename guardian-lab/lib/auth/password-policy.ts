export const MAX_PASSWORD_BYTES = 72;

/** bcrypt truncates UTF-8 input after 72 bytes, including partial multibyte characters. */
export function fitsPasswordLimit(password: string) {
  return (
    password.length <= MAX_PASSWORD_BYTES &&
    new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES
  );
}
