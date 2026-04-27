import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { adminUserSchema } from "../validators/user.validator";
import { handleFormError } from "../util/errorHandler.util";
import { db } from "../config/db";
import { RowDataPacket } from "mysql2";

export const adminController = {
  async dashboard(_req: Request, res: Response) {
    const [stats] = await db.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM users) AS users_count,
         (SELECT COUNT(*) FROM fishing_spots) AS spots_count,
         (SELECT COUNT(*) FROM catches) AS catches_count,
         (SELECT COUNT(*) FROM favorites) AS favorites_count`,
    );
    res.render("admin/dashboard", { stats: stats[0] });
  },

  async listUsers(_req: Request, res: Response) {
    const users = await userService.listAll();
    res.render("admin/users-list", { users });
  },

  getNewUser(_req: Request, res: Response) {
    res.render("admin/user-form", { user: null, action: "/admin/users" });
  },
  async postNewUser(req: Request, res: Response) {
    try {
      const input = adminUserSchema.parse(req.body);
      await userService.create(input);
      req.session.flash = { type: "success", message: "Používateľ bol vytvorený." };
      res.redirect("/admin/users");
    } catch (err) {
      handleFormError(err, req, res, "/admin/users/new", req.body);
    }
  },

  async getEditUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = await userService.getById(id);
    if (!user) return res.status(404).render("errors/404");
    res.render("admin/user-form", { user, action: `/admin/users/${id}/edit` });
  },
  async postEditUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    try {
      const input = adminUserSchema.parse(req.body);
      await userService.update(id, input);
      req.session.flash = { type: "success", message: "Údaje boli uložené." };
      res.redirect("/admin/users");
    } catch (err) {
      handleFormError(err, req, res, `/admin/users/${id}/edit`, req.body);
    }
  },

  async postDeleteUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (id === req.session.userId) {
      req.session.flash = { type: "error", message: "Nemôžete zmazať sám seba." };
      return res.redirect("/admin/users");
    }
    await userService.remove(id);
    req.session.flash = { type: "info", message: "Používateľ bol odstránený." };
    res.redirect("/admin/users");
  },
};
