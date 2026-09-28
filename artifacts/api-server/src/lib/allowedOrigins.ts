import { logger } from "./logger.js";

const allowedOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  logger.warn("ALLOWED_ORIGINS is unset; retaining existing unrestricted CORS behavior");
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  return !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);
}
