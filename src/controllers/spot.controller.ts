import { Request, Response } from "express";
import { spotService } from "../services/spot.service";
import { catchService } from "../services/catch.service";
import { spotSchema } from "../validators/spot.validator";
import { WaterType } from "../models/WaterType";
import { Spot } from "../models/Spot";
import { handleFormError } from "../util/errorHandler.util";

export const spotController = {
  async list(req: Request, res: Response) {
    const water_type_id = req.query.water_type ? Number(req.query.water_type) : undefined;
    const region = req.query.region ? String(req.query.region) : undefined;
    const [spots, waterTypes] = await Promise.all([
      spotService.list({ water_type_id, region }),
      WaterType.findAll(),
    ]);
    res.render("spots/list", {
      spots,
      waterTypes,
      filters: { water_type_id, region },
    });
  },

  async detail(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(404).render("errors/404");
    const spot = await spotService.detail(id);
    if (!spot) return res.status(404).render("errors/404");
    const [topCatches, isFavorite] = await Promise.all([
      catchService.topBySpot(id),
      req.session.userId ? Spot.isFavorite(req.session.userId, id) : Promise.resolve(false),
    ]);
    res.render("spots/detail", { spot, topCatches, isFavorite });
  },

  async getNew(_req: Request, res: Response) {
    const waterTypes = await WaterType.findAll();
    res.render("spots/form", { waterTypes, spot: null, action: "/revires" });
  },
  async postNew(req: Request, res: Response) {
    try {
      const input = spotSchema.parse(req.body);
      const imagePath = req.file ? "/images/uploads/" + req.file.filename : null;
      const spot = await spotService.create(input, req.session.userId!, imagePath);
      req.session.flash = { type: "success", message: "Revír bol pridaný." };
      res.redirect(`/revires/${spot.id}`);
    } catch (err) {
      handleFormError(err, req, res, "/revires/new", req.body);
    }
  },

  async getEdit(req: Request, res: Response) {
    const id = Number(req.params.id);
    const [spot, waterTypes] = await Promise.all([spotService.detail(id), WaterType.findAll()]);
    if (!spot) return res.status(404).render("errors/404");
    res.render("spots/form", { waterTypes, spot, action: `/revires/${id}/edit` });
  },
  async postEdit(req: Request, res: Response) {
    const id = Number(req.params.id);
    try {
      const input = spotSchema.parse(req.body);
      const imagePath = req.file ? "/images/uploads/" + req.file.filename : undefined;
      await spotService.update(id, input, imagePath);
      req.session.flash = { type: "success", message: "Zmeny uložené." };
      res.redirect(`/revires/${id}`);
    } catch (err) {
      handleFormError(err, req, res, `/revires/${id}/edit`, req.body);
    }
  },

  async postDelete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await spotService.remove(id);
    req.session.flash = { type: "info", message: "Revír bol vymazaný." };
    res.redirect("/revires");
  },

  async myDiary(req: Request, res: Response) {
    const [spots, catches, favorites] = await Promise.all([
      spotService.myDiary(req.session.userId!),
      catchService.byUser(req.session.userId!),
      spotService.favorites(req.session.userId!),
    ]);
    res.render("spots/diary", { spots, catches, favorites });
  },

  async toggleFavorite(req: Request, res: Response) {
    const id = Number(req.params.id);
    const isFav = await Spot.toggleFavorite(req.session.userId!, id);
    res.json({ ok: true, favorite: isFav });
  },
};
