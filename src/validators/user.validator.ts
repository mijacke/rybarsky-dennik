import { z } from "zod";

export const adminUserSchema = z.object({
  name: z.string().trim().min(2, "Meno musí mať aspoň 2 znaky.").max(120),
  email: z.string().trim().toLowerCase().email("Neplatný email."),
  isAdmin: z
    .union([z.literal("on"), z.literal("1"), z.literal(""), z.undefined()])
    .transform((v) => (v === "on" || v === "1" ? 1 : 0)),
  password: z
    .string()
    .optional()
    .transform((v) => (v && v.length ? v : undefined))
    .refine((v) => v === undefined || v.length >= 8, "Heslo musí mať aspoň 8 znakov."),
});

export type AdminUserInput = z.infer<typeof adminUserSchema>;
