import { trimFullName } from "./authDisplayName";

// Shared with user creation: keep the established email-derived name fallback.
export function emailDisplayName(email: string) {
  return email.split("@", 1)[0].replace(/[._-]+/g, " ").trim().replace(/\s+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function userDisplayName(fullName: string | null | undefined, email?: string | null) {
  const name = trimFullName(fullName);
  const isEmail = /^[^\s@]+@[^\s@]+$/.test(name);
  if (name && !isEmail) return name;
  return emailDisplayName(email?.trim() || (isEmail ? name : "")) || "Unnamed user";
}
