import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { spotService } from "../services/spot.service";
import { catchService } from "../services/catch.service";
import { WaterType } from "../models/WaterType";
import { db } from "../config/db";

export const homeController = {
  async index(_req: Request, res: Response) {
    const [featured, allSpots, recentCatches, waterTypes, stats] = await Promise.all([
      spotService.featured(),
      spotService.list(),
      catchService.recent(),
      WaterType.findAll(),
      (async () => {
        const [rows] = await db.query<RowDataPacket[]>(
          `SELECT
             (SELECT COUNT(*) FROM users) AS users_count,
             (SELECT COUNT(*) FROM catches) AS catches_count,
             (SELECT COUNT(*) FROM favorites) AS favorites_count`,
        );
        const r = (rows[0] || {}) as { users_count?: number; catches_count?: number; favorites_count?: number };
        return {
          users: Number(r.users_count || 0),
          catches: Number(r.catches_count || 0),
          favorites: Number(r.favorites_count || 0),
        };
      })(),
    ]);
    res.render("home/index", { featured, allSpots, recentCatches, waterTypes, stats });
  },

  async map(_req: Request, res: Response) {
    const spots = await spotService.list();
    res.render("map/index", { spots });
  },
};
