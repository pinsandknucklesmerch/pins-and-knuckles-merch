export const pinsHubAccessLevels = ["read", "write", "admin", "developer"] as const;
export type PinsHubAccessLevel = (typeof pinsHubAccessLevels)[number];

const hierarchy: Record<PinsHubAccessLevel, number> = { read: 0, write: 1, admin: 2, developer: 3 };

export function isPinsHubAccessLevel(value: string | null | undefined): value is PinsHubAccessLevel {
  return typeof value === "string" && value in hierarchy;
}

export function hasPinsHubAccessLevel(actual: string | null | undefined, required: PinsHubAccessLevel) {
  return isPinsHubAccessLevel(actual) && hierarchy[actual] >= hierarchy[required];
}

export function canManagePinsHub(accessLevel: string | null | undefined) {
  return hasPinsHubAccessLevel(accessLevel, "admin");
}

export function canUseDeveloperArea(accessLevel: string | null | undefined, organisationRole?: string | null) {
  return organisationRole === "owner" || accessLevel === "developer";
}

export const canManageOrganisationUsers = canUseDeveloperArea;

export const pinsHubAccessLabels: Record<PinsHubAccessLevel, string> = { read: "Read", write: "Write", admin: "Admin", developer: "Developer" };
