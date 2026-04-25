import { z } from "zod";

export const spotSchema = z.object({
  name: z.string().trim().min(2, "Názov revíru je príliš krátky.").max(180),
  description: z.string().trim().min(20, "Popis musí mať aspoň 20 znakov.").max(4000),
  water_type_id: z.coerce.number().int().positive("Vyberte typ vody."),
  region: z.string().trim().min(2, "Zadajte kraj."),
  city: z.string().trim().min(2, "Zadajte mesto/obec."),
  gps_lat: z
    .union([z.coerce.number().min(-90).max(90), z.literal("").transform(() => null)])
    .nullable()
    .optional(),
  gps_lon: z
    .union([z.coerce.number().min(-180).max(180), z.literal("").transform(() => null)])
    .nullable()
    .optional(),
});

export type SpotInput = z.infer<typeof spotSchema>;
