export const MEMBER_CLASSIFICATIONS = [
  "dashboard_account_manager",
  "admin_hidden",
  "other_non_dashboard",
] as const;

export type MemberClassification = typeof MEMBER_CLASSIFICATIONS[number];
export type CanonicalMemberKey = "hardus" | "justin" | "bux" | "shannon" | "johan" | "other_non_dashboard";

export type CanonicalMemberIdentity = {
  key: CanonicalMemberKey;
  displayName: string;
  classification: MemberClassification;
};

export type SourceMemberIdentity = {
  id?: string | null;
  name?: string | null;
};

const MEMBERS: Record<CanonicalMemberKey, CanonicalMemberIdentity> = {
  hardus: { key: "hardus", displayName: "Hardus", classification: "dashboard_account_manager" },
  justin: { key: "justin", displayName: "Justin", classification: "dashboard_account_manager" },
  bux: { key: "bux", displayName: "Bux", classification: "dashboard_account_manager" },
  shannon: { key: "shannon", displayName: "Shannon", classification: "admin_hidden" },
  johan: { key: "johan", displayName: "Johan", classification: "admin_hidden" },
  other_non_dashboard: { key: "other_non_dashboard", displayName: "Other / reconciliation", classification: "other_non_dashboard" },
};

const MONDAY_IDS: Record<string, CanonicalMemberKey> = {
  "29869326": "hardus",
  "69507598": "justin",
  "26816626": "bux",
  "14589779": "shannon",
  "14589471": "johan",
  "102110325": "other_non_dashboard",
};

const MONDAY_NAMES: Record<string, CanonicalMemberKey> = {
  hardus: "hardus",
  "justin du preez": "justin",
  bux: "bux",
  shannon: "shannon",
  johan: "johan",
  seth: "other_non_dashboard",
  "seth van niekerk": "other_non_dashboard",
};

const EPCC_NAMES: Record<string, CanonicalMemberKey> = {
  hardus: "hardus",
  "justin du preez": "justin",
  bux: "bux",
  "shannon wellby": "shannon",
  johan: "johan",
  seth: "other_non_dashboard",
};

export function normaliseSourceMemberName(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
}

function identity(key: CanonicalMemberKey): CanonicalMemberIdentity {
  return MEMBERS[key];
}

/** Monday person IDs are authoritative; names are an explicit legacy fallback. */
export function mapMondayMember(source: SourceMemberIdentity): CanonicalMemberIdentity {
  const byId = source.id ? MONDAY_IDS[String(source.id)] : undefined;
  return identity(byId ?? MONDAY_NAMES[normaliseSourceMemberName(source.name)] ?? "other_non_dashboard");
}

export function isRecognisedMondayMember(source: SourceMemberIdentity) {
  return Boolean((source.id && MONDAY_IDS[String(source.id)]) || MONDAY_NAMES[normaliseSourceMemberName(source.name)]);
}

/** EPCC exposes salesperson names, not stable employee IDs. */
export function mapEpccMember(sourceName: string | null | undefined): CanonicalMemberIdentity {
  return identity(EPCC_NAMES[normaliseSourceMemberName(sourceName)] ?? "other_non_dashboard");
}

export function isRecognisedEpccMember(sourceName: string | null | undefined) {
  return Boolean(EPCC_NAMES[normaliseSourceMemberName(sourceName)]);
}

export function isDashboardAccountManager(classification: MemberClassification) {
  return classification === "dashboard_account_manager";
}

export function isAdminVisibleMember(classification: MemberClassification) {
  return classification !== undefined;
}
