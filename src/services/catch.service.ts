import { Catch } from "../models/Catch";
import { CatchInput } from "../validators/catch.validator";

export const catchService = {
  async listBySpot(spotId: number) {
    return Catch.findBySpot(spotId);
  },
  async topBySpot(spotId: number) {
    return Catch.findTopBySpot(spotId, 5);
  },
  async recent() {
    return Catch.findRecent(6);
  },
  async byUser(userId: number) {
    return Catch.findByUser(userId);
  },
  async create(spotId: number, userId: number, input: CatchInput, photoPath: string | null) {
    const c = new Catch({
      spot_id: spotId,
      user_id: userId,
      species: input.species,
      weight_kg: input.weight_kg,
      length_cm: input.length_cm,
      rating: input.rating,
      comment: input.comment ?? null,
      photo_path: photoPath,
    });
    await c.save();
    return c;
  },
  async update(id: number, input: CatchInput) {
    const c = await Catch.findById(id);
    if (!c) throw new Error("Úlovok nenájdený.");
    c.species = input.species;
    c.weight_kg = input.weight_kg;
    c.length_cm = input.length_cm;
    c.rating = input.rating;
    c.comment = input.comment ?? null;
    await c.save();
    return c;
  },
  async remove(id: number) {
    await Catch.delete(id);
  },
  async getOwner(id: number): Promise<number | null> {
    const c = await Catch.findById(id);
    return c ? c.user_id : null;
  },
};
