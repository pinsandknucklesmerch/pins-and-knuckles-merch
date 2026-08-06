import { allOrganisationRoles, pinsHubAccessLevels } from "../types";

const roles = new Set(allOrganisationRoles);
const accessLevels = new Set(pinsHubAccessLevels);

export type ValidatedUserUpdate = {
  membershipId: string;
  fullName: string;
  role: string;
  accessLevel: string;
  mondayMemberId: string | null;
  isActive: boolean;
};

export function validateUserUpdateInput(formData: FormData): ValidatedUserUpdate | { error: string } {
  const membershipId = String(formData.get("membership_id") ?? "").trim();
  if (!membershipId) return { error: "User could not be identified." };

  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  if (!fullName) return { error: "Full name is required." };
  if (fullName.length > 200) return { error: "Full name must be 200 characters or fewer." };

  const role = String(formData.get("organisation_role") ?? "").trim().toLowerCase();
  if (!roles.has(role as never)) return { error: "Select a valid organisation role." };
  const accessLevel = String(formData.get("access_level") ?? "").trim().toLowerCase();
  if (!accessLevels.has(accessLevel as never)) return { error: "Select a valid Pins Hub access level." };

  const mondayValue = String(formData.get("monday_member_id") ?? "").trim();
  const mondayMemberId = !mondayValue || mondayValue.toLowerCase() === "none" ? null : mondayValue;
  const activeValues = formData.getAll("is_active").map((value) => String(value));
  const isActive = activeValues.length ? activeValues.at(-1) === "true" : true;

  return { membershipId, fullName, role, accessLevel, mondayMemberId, isActive };
}
