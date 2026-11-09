import { z } from "zod";

const responseSchema = z.object({ status: z.boolean().optional(), Status: z.boolean().optional() });
export async function sendWhatsApp(phone: string, code: string): Promise<boolean> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return false;
  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        target: phone.replace(/^\+/, ""),
        message: `Kode Guardian Lab kamu: ${code}. Berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.`,
        countryCode: "0",
        connectOnly: true,
        preview: false,
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    const body: unknown = await response.json();
    const parsed = responseSchema.safeParse(body);
    return (
      response.ok && parsed.success && (parsed.data.status === true || parsed.data.Status === true)
    );
  } catch {
    return false;
  }
}
