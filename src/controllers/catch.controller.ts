import { Request, Response } from "express";
import { catchService } from "../services/catch.service";
import { catchSchema } from "../validators/catch.validator";

export const catchController = {
  async listJson(req: Request, res: Response) {
    const spotId = Number(req.params.id);
    const items = await catchService.listBySpot(spotId);
    res.json({ items, currentUserId: req.session.userId || null, isAdmin: !!req.session.isAdmin });
  },

  async createJson(req: Request, res: Response) {
    try {
      const spotId = Number(req.params.id);
      const input = catchSchema.parse(req.body);
      const photo = req.file ? "/images/uploads/" + req.file.filename : null;
      const created = await catchService.create(spotId, req.session.userId!, input, photo);
      res.status(201).json({ ok: true, item: created });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Chyba validácie." });
    }
  },

  async patchJson(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const ownerId = await catchService.getOwner(id);
      if (ownerId === null) return res.status(404).json({ error: "Úlovok nenájdený." });
      if (ownerId !== req.session.userId) return res.status(403).json({ error: "Zakázané." });
      const input = catchSchema.parse(req.body);
      const updated = await catchService.update(id, input);
      res.json({ ok: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Chyba validácie." });
    }
  },

  async deleteJson(req: Request, res: Response) {
    const id = Number(req.params.id);
    const ownerId = await catchService.getOwner(id);
    if (ownerId === null) return res.status(404).json({ error: "Úlovok nenájdený." });
    if (ownerId !== req.session.userId && !req.session.isAdmin) {
      return res.status(403).json({ error: "Zakázané." });
    }
    await catchService.remove(id);
    res.json({ ok: true });
  },
};
