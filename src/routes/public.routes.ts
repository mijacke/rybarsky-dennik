import { Router } from "express";
import rateLimit from "express-rate-limit";
import { homeController } from "../controllers/home.controller";
import { authController } from "../controllers/auth.controller";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Príliš veľa pokusov. Skúste to o chvíľu.",
});

router.get("/", homeController.index);
router.get("/map", homeController.map);

router.get("/registracia", authController.getRegister);
router.post("/registracia", authLimiter, authController.postRegister);
router.get("/prihlasenie", authController.getLogin);
router.post("/prihlasenie", authLimiter, authController.postLogin);
router.post("/odhlasenie", authController.postLogout);

router.post("/api/theme", authController.postTheme);

export default router;
