import { z } from "zod";

export const catchSchema = z.object({
  species: z.string().trim().min(2, "Zadajte druh ryby.").max(120),
  weight_kg: z.coerce.number().positive("Hmotnosť musí byť kladná.").max(500),
  length_cm: z.coerce.number().positive("Dĺžka musí byť kladná.").max(400),
  rating: z.coerce.number().int().min(1, "Hodnotenie 1–5.").max(5),
  comment: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length ? v : null)),
});

export type CatchInput = z.infer<typeof catchSchema>;
