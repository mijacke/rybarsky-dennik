import { Spot } from "../models/Spot";
import { Address } from "../models/Address";
import { SpotInput } from "../validators/spot.validator";

export const spotService = {
  async list(filters?: { water_type_id?: number; region?: string }) {
    return Spot.findAllWithJoin(filters);
  },

  async featured() {
    return Spot.featured(4);
  },

  async detail(id: number) {
    return Spot.findDetailById(id);
  },

  async create(input: SpotInput, userId: number, imageLocation: string | null) {
    const address = new Address({
      region: input.region,
      city: input.city,
      gps_lat: input.gps_lat ?? null,
      gps_lon: input.gps_lon ?? null,
    });
    await address.save();

    const spot = new Spot({
      name: input.name,
      description: input.description,
      water_type_id: input.water_type_id,
      address_id: address.id!,
      image_location: imageLocation,
      user_id: userId,
    });
    await spot.save();
    return spot;
  },

  async update(id: number, input: SpotInput, imageLocation?: string | null) {
    const spot = await Spot.findById(id);
    if (!spot) throw new Error("Revír nebol nájdený.");

    const address = await Address.findById(spot.address_id);
    if (!address) throw new Error("Adresa neexistuje.");
    address.merge({
      region: input.region,
      city: input.city,
      gps_lat: input.gps_lat ?? null,
      gps_lon: input.gps_lon ?? null,
    });
    await address.save();

    spot.merge({
      name: input.name,
      description: input.description,
      water_type_id: input.water_type_id,
    });
    if (imageLocation !== undefined) spot.image_location = imageLocation;
    await spot.save();
    return spot;
  },

  async remove(id: number) {
    const spot = await Spot.findById(id);
    if (!spot) return;
    await Spot.delete(id);
    await Address.delete(spot.address_id);
  },

  async myDiary(userId: number) {
    return Spot.findByUserId(userId);
  },

  async favorites(userId: number) {
    return Spot.findFavoritesByUser(userId);
  },
};
