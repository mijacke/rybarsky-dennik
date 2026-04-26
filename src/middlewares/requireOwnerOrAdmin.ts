import { Request, Response, NextFunction } from "express";
import { Spot } from "../models/Spot";

export async function requireSpotOwnerOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.session.userId) {
    res.status(401).render("errors/401");
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(404).render("errors/404");
    return;
  }
  const spot = await Spot.findById(id);
  if (!spot) {
    res.status(404).render("errors/404");
    return;
  }
  const owner = spot.user_id === req.session.userId;
  if (!owner && !req.session.isAdmin) {
    res.status(403).render("errors/403");
    return;
  }
  (req as any).spot = spot;
  next();
}
