import { randomBytes } from "node:crypto";
import { lstat, open, readFile, rename, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs, parseEnv } from "node:util";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const examplePath = fileURLToPath(new URL("../.env.example", import.meta.url));
const temporaryPath = `${envPath}.keygen.tmp`;
const managedKeys = ["SESSION_SECRET", "SANDBOX_BROKER_KEY"];

class KeyGenerationError extends Error {}

async function readEnvironment() {
  try {
    const info = await lstat(envPath);
    if (!info.isFile() || info.isSymbolicLink())
      throw new KeyGenerationError(".env harus berupa file biasa, bukan symlink.");
    return await readFile(envPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function readEntries(content) {
  // Consume complete quoted assignments so key-like lines inside other values stay untouched.
  const pattern = /^(\uFEFF?[\t ]*(?:export[\t ]+)?)([A-Za-z_][A-Za-z0-9_]*)([\t ]*=[\t ]*)("(?:\\[\s\S]|[^"\\])*"|'[^']*'|`[^`]*`|(?![\t ]*["'`])[^#\r\n]*)([\t ]*(?:#[^\r\n]*)?)(\r?\n|$)/gm;
  return Array.from(content.matchAll(pattern), (match) => {
    const token = match[4].trimEnd();
    const start = match.index + match[1].length + match[2].length + match[3].length;
    return {
      name: match[2],
      token,
      start,
      end: start + token.length,
      statementStart: match.index,
      statementEnd: match.index + match[0].length,
    };
  });
}

function findEntry(content, entries, values, key) {
  const matches = entries.filter((entry) => entry.name === key);
  if (matches.length > 1)
    throw new KeyGenerationError(`${key} tercantum lebih dari sekali. Rapikan .env terlebih dahulu.`);
  if (Object.hasOwn(values, key) && matches.length !== 1)
    throw new KeyGenerationError(`Format ${key} tidak dapat diperbarui dengan aman.`);
  const declarations = new RegExp(`^[\\t ]*(?:export[\\t ]+)?${key}[\\t ]*=`, "gm");
  for (const match of content.matchAll(declarations)) {
    if (
      !entries.some(
        (entry) => match.index >= entry.statementStart && match.index < entry.statementEnd,
      )
    )
      throw new KeyGenerationError(`Format ${key} tidak dapat diperbarui dengan aman.`);
  }
  return matches[0];
}

function isPlaceholder(key, value, example) {
  return (
    !value?.trim() ||
    (example[key] && value === example[key]) ||
    (key === "SESSION_SECRET" && value.startsWith("your_session_secret"))
  );
}

async function generate() {
  const { values: options } = parseArgs({
    options: {
      key: { type: "string", default: process.env.GUARDIAN_KEY_NAME ?? "all" },
      force: { type: "string", default: process.env.GUARDIAN_KEY_FORCE ?? "0" },
    },
  });
  if (options.key !== "all" && !managedKeys.includes(options.key))
    throw new KeyGenerationError("KEY harus all, SESSION_SECRET, atau SANDBOX_BROKER_KEY.");
  if (!["0", "1"].includes(options.force))
    throw new KeyGenerationError("FORCE harus 0 atau 1.");

  let temporary;
  let ownsTemporary = false;
  try {
    try {
      temporary = await open(temporaryPath, "wx", 0o600);
      ownsTemporary = true;
    } catch (error) {
      if (error.code === "EEXIST")
        throw new KeyGenerationError(
          "Generator lain atau file .env.keygen.tmp masih ada. Pastikan proses lama berhenti sebelum membersihkan file sementara.",
        );
      throw error;
    }
    const original = await readEnvironment();
    const template = await readFile(examplePath, "utf8");
    const content = original ?? template;
    const values = parseEnv(content);
    const example = parseEnv(template);
    const entries = readEntries(content);
    const selected = options.key === "all" ? managedKeys : [options.key];
    const changes = [];
    const appended = [];
    const messages = [];

    for (const key of selected) {
      const entry = findEntry(content, entries, values, key);
      if (options.force !== "1" && !isPlaceholder(key, values[key], example)) {
        if (values[key].length < 32)
          throw new KeyGenerationError(`${key} terlalu pendek. Gunakan FORCE=1 untuk menggantinya.`);
        messages.push(`${key}: dipertahankan.`);
        continue;
      }
      let token;
      if (key === "SESSION_SECRET" && options.force !== "1" && values.AUTH_SECRET?.length >= 32) {
        const legacy = findEntry(content, entries, values, "AUTH_SECRET");
        if (legacy && !values.AUTH_SECRET.startsWith("your_session_secret")) {
          if (/\$(?:\{|[A-Za-z_])/.test(legacy.token))
            throw new KeyGenerationError(
              "AUTH_SECRET memakai referensi variabel. Isi SESSION_SECRET secara konkret atau gunakan FORCE=1 untuk rotasi.",
            );
          token = legacy.token;
        }
      }
      const reused = Boolean(token);
      token ??= randomBytes(32).toString("hex");
      if (entry) changes.push({ ...entry, token });
      else appended.push(`${key}=${token}`);
      messages.push(`${key}: ${reused ? "menggunakan AUTH_SECRET yang sudah ada" : "dibuat"}.`);
    }

    let updated = content;
    for (const change of changes.sort((a, b) => b.start - a.start))
      updated = updated.slice(0, change.start) + change.token + updated.slice(change.end);
    const newline = content.includes("\r\n") ? "\r\n" : "\n";
    if (appended.length) {
      if (updated && !updated.endsWith("\n")) updated += newline;
      updated += appended.join(newline) + newline;
    }
    if (original === null || updated !== content) {
      await temporary.writeFile(updated, "utf8");
      await temporary.sync();
      await temporary.close();
      temporary = null;
      if ((await readEnvironment()) !== original)
        throw new KeyGenerationError(".env berubah saat generator berjalan. Jalankan ulang perintah.");
      await rename(temporaryPath, envPath);
      ownsTemporary = false;
      console.log(".env diperbarui; nilai key tidak dicetak.");
      console.log("Jalankan ulang make dev jika stack sebelumnya sudah aktif.");
    } else console.log("Key sudah terisi. .env dipertahankan.");
    for (const message of messages) console.log(message);
  } finally {
    await temporary?.close();
    if (ownsTemporary) await rm(temporaryPath, { force: true });
  }
}

try {
  await generate();
} catch (error) {
  console.error(
    error instanceof KeyGenerationError
      ? error.message
      : "Generator gagal. Periksa argumen, file .env.example, serta izin baca/tulis direktori proyek.",
  );
  process.exitCode = 1;
}
