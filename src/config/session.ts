import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import dotenv from "dotenv";

dotenv.config();

const MySQLStore = MySQLStoreFactory(session as any);

const store = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ticha_voda",
  createDatabaseTable: true,
});

export const sessionMiddleware = session({
  name: "ticha_voda_sid",
  secret: process.env.SESSION_SECRET || "dev-only-secret",
  store: store as any,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
