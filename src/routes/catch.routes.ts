import { Router } from "express";
import { catchController } from "../controllers/catch.controller";
import { requireAuthJson } from "../middlewares/requireAuth";
import { upload } from "../config/multer";

const router = Router();

router.get("/revires/:id/catches", catchController.listJson);
router.post(
  "/revires/:id/catches",
  requireAuthJson,
  upload.single("photo"),
  catchController.createJson,
);
router.patch("/catches/:id", requireAuthJson, catchController.patchJson);
router.delete("/catches/:id", requireAuthJson, catchController.deleteJson);

export default router;
