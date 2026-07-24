export type DashboardView = "overview" | "year-comparison";

export function parseDashboardView(value: string | undefined): DashboardView {
  return value === "year-comparison" ? "year-comparison" : "overview";
}
