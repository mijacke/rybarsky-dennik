import { Request, Response, NextFunction } from "express";

export function setLocals(req: Request, res: Response, next: NextFunction): void {
  res.locals.user = req.session.userId
    ? { id: req.session.userId, name: req.session.userName, isAdmin: !!req.session.isAdmin }
    : null;
  res.locals.isAdmin = !!req.session.isAdmin;
  res.locals.theme = req.session.theme || "dark";

  res.locals.error = req.session.error || null;
  res.locals.formData = req.session.formData || {};
  res.locals.flash = req.session.flash || null;

  req.session.error = undefined;
  req.session.formData = undefined;
  req.session.flash = null;

  res.locals.currentPath = req.path;
  next();
}
