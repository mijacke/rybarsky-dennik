import { Router } from "express";
import { spotController } from "../controllers/spot.controller";
import { requireAuth, requireAuthJson } from "../middlewares/requireAuth";
import { requireSpotOwnerOrAdmin } from "../middlewares/requireOwnerOrAdmin";
import { upload } from "../config/multer";

const router = Router();

router.get("/", spotController.list);
router.get("/new", requireAuth, spotController.getNew);
router.post("/", requireAuth, upload.single("image"), spotController.postNew);

router.get("/diary", requireAuth, spotController.myDiary);

router.get("/:id", spotController.detail);
router.get("/:id/edit", requireSpotOwnerOrAdmin, spotController.getEdit);
router.post(
  "/:id/edit",
  requireSpotOwnerOrAdmin,
  upload.single("image"),
  spotController.postEdit,
);
router.post("/:id/delete", requireSpotOwnerOrAdmin, spotController.postDelete);

router.post("/:id/favorite", requireAuthJson, spotController.toggleFavorite);

export default router;
