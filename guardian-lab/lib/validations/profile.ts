import { z } from "zod";
import { academyProgressSchema } from "./academy";
import { baseRegisterSchema } from "./auth";

export const profileUpdateSchema = z
  .object({
    name: baseRegisterSchema.shape.name.refine(
      (value) => !/[\p{Cc}\p{Cf}]/u.test(value),
      "Nama tidak boleh mengandung karakter kontrol.",
    ),
    revision: z.iso.datetime(),
  })
  .strict();
export const profileSavedSchema = z.object({
  name: z.string(),
  updatedAt: z.iso.datetime(),
});
export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  verified: z.boolean(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  investigations: z.number().int().nonnegative(),
  progress: academyProgressSchema,
});
export type Profile = z.infer<typeof profileSchema>;
