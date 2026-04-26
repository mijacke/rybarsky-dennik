import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).render("errors/401");
    return;
  }
  if (!req.session.isAdmin) {
    res.status(403).render("errors/403");
    return;
  }
  next();
}
