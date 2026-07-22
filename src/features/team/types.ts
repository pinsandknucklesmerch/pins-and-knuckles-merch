export const organisationRoles = ["owner", "admin", "manager", "staff", "viewer"] as const;
export const pinsHubAccessLevels = ["admin", "write", "read"] as const;

export type OrganisationRole = (typeof organisationRoles)[number];
export type PinsHubAccessLevel = (typeof pinsHubAccessLevels)[number];

export type InviteActionState = {
  status: "idle" | "success" | "error" | "rate-limit";
  message: string | null;
};

export const initialInviteActionState: InviteActionState = {
  status: "idle",
  message: null,
};
