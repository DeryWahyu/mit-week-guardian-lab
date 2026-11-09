import bcrypt from "bcryptjs";
import { fitsPasswordLimit } from "./password-policy";

const SALT_ROUNDS = process.env.NODE_ENV === "test" ? 4 : 10;

export async function hashPassword(password: string): Promise<string> {
  if (!fitsPasswordLimit(password)) throw new Error("Password maksimal 72 byte UTF-8.");
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!fitsPasswordLimit(password)) return false;
  return bcrypt.compare(password, hash);
}
