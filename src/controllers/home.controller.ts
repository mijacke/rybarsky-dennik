import { Request, Response } from "express";
import { spotService } from "../services/spot.service";
import { catchService } from "../services/catch.service";
import { WaterType } from "../models/WaterType";

export const homeController = {
  async index(_req: Request, res: Response) {
    const [featured, recentCatches, waterTypes] = await Promise.all([
      spotService.featured(),
      catchService.recent(),
      WaterType.findAll(),
    ]);
    res.render("home/index", { featured, recentCatches, waterTypes });
  },

  async map(_req: Request, res: Response) {
    const spots = await spotService.list();
    res.render("map/index", { spots });
  },
};
