import express, { Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";
import dotenv from "dotenv";

import { sessionMiddleware } from "./config/session";
import { ensureSchema } from "./config/db";
import { setLocals } from "./middlewares/setLocals";

import publicRoutes from "./routes/public.routes";
import spotRoutes from "./routes/spot.routes";
import catchRoutes from "./routes/catch.routes";
import adminRoutes from "./routes/admin.routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://*.basemaps.cartocdn.com", "https://unpkg.com"],
        "connect-src": ["'self'"],
      },
    },
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.use(sessionMiddleware);
app.use(setLocals);

app.use("/", publicRoutes);
app.use("/revires", spotRoutes);
app.use("/", catchRoutes);
app.use("/admin", adminRoutes);

app.get("/moj-dennik", (req, res, next) => {
  if (!req.session.userId) return res.redirect("/prihlasenie");
  return import("./controllers/spot.controller").then((m) => m.spotController.myDiary(req, res)).catch(next);
});

app.use((_req: Request, res: Response) => {
  res.status(404).render("errors/404");
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[500]", err);
  res.status(500).render("errors/500", { message: err?.message || "Neznáma chyba." });
});

(async () => {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`✦ Tichá voda beží na http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("Chyba pri štarte:", e);
    process.exit(1);
  }
})();
