import { timingSafeEqual } from "node:crypto";

export function isEpccCronRequestAuthorised(request: Request, secret = process.env.CRON_SECRET) {
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || provided.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
}
