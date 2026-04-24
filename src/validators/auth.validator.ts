import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Heslo musí mať aspoň 8 znakov.")
  .refine((v) => /[A-Z]/.test(v), "Heslo musí obsahovať veľké písmeno.")
  .refine((v) => /[a-z]/.test(v), "Heslo musí obsahovať malé písmeno.")
  .refine((v) => /\d/.test(v), "Heslo musí obsahovať číslicu.");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Meno musí mať aspoň 2 znaky.").max(120),
    email: z.string().trim().toLowerCase().email("Neplatný email."),
    password: passwordRule,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Heslá sa nezhodujú.",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Neplatný email."),
  password: z.string().min(1, "Zadajte heslo."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
