import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("API Error:", err);

  // Prisma errors
  if (err.code === "P2002") {
    res.status(409).json({ error: "A record with that value already exists." });
    return;
  }
  if (err.code === "P2025") {
    res.status(404).json({ error: "Record not found." });
    return;
  }

  const status = err.status ?? 500;
  const message = status === 500 ? "Internal server error" : err.message;

  res.status(status).json({ error: message });
}
