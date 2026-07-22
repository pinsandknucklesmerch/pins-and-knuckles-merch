import type { InviteActionState, OrganisationRole, PinsHubAccessLevel } from "../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORGANISATION_ROLES = new Set<OrganisationRole>(["owner", "admin", "manager", "staff", "viewer"]);
const ACCESS_LEVELS = new Set<PinsHubAccessLevel>(["admin", "write", "read"]);

export function resolveSiteUrl(environment: NodeJS.ProcessEnv = process.env) {
  const configuredUrl = environment.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);
      if (url.protocol === "https:" || (environment.NODE_ENV === "development" && url.protocol === "http:")) return url.origin;
    } catch {}
    return null;
  }

  const productionHost = environment.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return `https://${productionHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return environment.NODE_ENV === "development" ? "http://localhost:3000" : null;
}

export function validateInviteInput(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  const role = String(formData.get("organisation_role") ?? "") as OrganisationRole;
  const accessLevel = String(formData.get("access_level") ?? "") as PinsHubAccessLevel;

  if (!EMAIL_PATTERN.test(email) || email.length > 320 || !fullName || fullName.length > 200 || !ORGANISATION_ROLES.has(role) || !ACCESS_LEVELS.has(accessLevel)) {
    return null;
  }
  return { email, fullName, role, accessLevel };
}

export function inviteFailureState(error: unknown): InviteActionState {
  const errorCode = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = typeof error === "object" && error && "message" in error ? String(error.message).toLowerCase() : "";
  if (errorCode === "over_email_send_rate_limit" || errorCode === "over_request_rate_limit" || message.includes("rate limit") || message.includes("email limit")) {
    return { status: "rate-limit", message: "Email limit reached. Try again later." };
  }
  return { status: "error", message: "Invitation could not be sent." };
}
