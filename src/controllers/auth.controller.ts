import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { handleFormError } from "../util/errorHandler.util";

export const authController = {
  getRegister(_req: Request, res: Response) {
    res.render("auth/register");
  },
  async postRegister(req: Request, res: Response) {
    try {
      const input = registerSchema.parse(req.body);
      const user = await authService.register(input);
      req.session.userId = user.id!;
      req.session.userName = user.name;
      req.session.isAdmin = !!user.isAdmin;
      req.session.flash = { type: "success", message: `Vitajte na palube, ${user.name}.` };
      res.redirect("/revires");
    } catch (err) {
      handleFormError(err, req, res, "/registracia", req.body);
    }
  },

  getLogin(_req: Request, res: Response) {
    res.render("auth/login");
  },
  async postLogin(req: Request, res: Response) {
    try {
      const input = loginSchema.parse(req.body);
      const user = await authService.login(input);
      req.session.userId = user.id!;
      req.session.userName = user.name;
      req.session.isAdmin = !!user.isAdmin;
      req.session.flash = { type: "success", message: `Vitajte späť, ${user.name}.` };
      res.redirect("/revires");
    } catch (err) {
      handleFormError(err, req, res, "/prihlasenie", req.body);
    }
  },

  postLogout(req: Request, res: Response) {
    req.session.destroy(() => {
      res.redirect("/");
    });
  },

  postTheme(req: Request, res: Response) {
    const theme = req.body.theme === "dark" ? "dark" : "light";
    req.session.theme = theme;
    res.json({ ok: true, theme });
  },
};
