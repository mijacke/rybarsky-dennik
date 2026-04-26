import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    req.session.flash = { type: "error", message: "Pre túto akciu sa musíte prihlásiť." };
    res.redirect("/prihlasenie");
    return;
  }
  next();
}

export function requireAuthJson(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Nie ste prihlásený." });
    return;
  }
  next();
}
