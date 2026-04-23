import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userName?: string;
    isAdmin?: boolean;
    error?: string;
    formData?: Record<string, any>;
    redirectPath?: string;
    flash?: { type: "success" | "error" | "info"; message: string } | null;
    theme?: "light" | "dark";
  }
}
