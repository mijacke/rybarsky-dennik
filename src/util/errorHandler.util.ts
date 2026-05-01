import { Request, Response } from "express";
import { ZodError } from "zod";

export function handleFormError(
  err: unknown,
  req: Request,
  res: Response,
  redirectPath: string,
  formData?: Record<string, any>,
): void {
  if (err instanceof ZodError) {
    req.session.error = err.issues.map((i) => i.message).join(" • ");
  } else if (err instanceof Error) {
    req.session.error = err.message;
  } else {
    req.session.error = "Nastala neočakávaná chyba.";
  }
  if (formData) req.session.formData = formData;
  req.session.redirectPath = redirectPath;
  res.redirect(redirectPath);
}
