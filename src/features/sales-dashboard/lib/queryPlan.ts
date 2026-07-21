export type DashboardView = "company" | "members";

export function getSalesDashboardQueryPlan(view: DashboardView, includeCompanyEntry: boolean, year: number) {
  return {
    companyYears: view === "company" ? [year, year - 1] : [year],
    fetchCompany: view === "company" || includeCompanyEntry,
    fetchMembers: view === "members",
    fetchTargets: view === "company",
  };
}
