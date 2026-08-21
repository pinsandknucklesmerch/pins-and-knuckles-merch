export type DashboardView = "overview" | "company-profit" | "ytd" | "snuggle" | "team-members";

export function parseDashboardView(value: string | undefined): DashboardView {
  if (value === "company-profit") return "company-profit";
  if (value === "snuggle") return "snuggle";
  if (value === "team-members") return "team-members";
  if (value === "ytd") return "ytd";
  return "overview";
}
