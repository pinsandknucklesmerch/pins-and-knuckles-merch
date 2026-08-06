export const organisationRoles = ["admin", "manager", "staff", "viewer"] as const;
export const allOrganisationRoles = ["owner", ...organisationRoles] as const;
export { pinsHubAccessLevels } from "@/lib/access/pinsHubRoles";

export type OrganisationRole = (typeof allOrganisationRoles)[number];
export type { PinsHubAccessLevel } from "@/lib/access/pinsHubRoles";

export type UserAccessActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialUserAccessActionState: UserAccessActionState = { status: "idle", message: null };

export type InviteActionState = {
  status: "idle" | "success" | "error" | "rate-limit";
  message: string | null;
};

export const initialInviteActionState: InviteActionState = {
  status: "idle",
  message: null,
};
