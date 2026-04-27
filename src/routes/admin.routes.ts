import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

router.use(requireAdmin);

router.get("/", adminController.dashboard);
router.get("/users", adminController.listUsers);
router.get("/users/new", adminController.getNewUser);
router.post("/users", adminController.postNewUser);
router.get("/users/:id/edit", adminController.getEditUser);
router.post("/users/:id/edit", adminController.postEditUser);
router.post("/users/:id/delete", adminController.postDeleteUser);

export default router;
