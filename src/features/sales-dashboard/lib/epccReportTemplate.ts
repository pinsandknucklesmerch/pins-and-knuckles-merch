export const EPCC_REPORT_TEMPLATE_VERSION = 1 as const;

export type EpccReportPageId = "company-profit" | "year-to-date";
export type EpccReportRegion = "company-profit" | "year-to-date-primary" | "year-to-date-performance";
export type EpccReportComponentType = "monthly-profit" | "bonus-profit" | "ytd-summary" | "previous-year-ytd" | "ytd-target" | "target-variance" | "monthly-profit-comparison" | "active-marketing-enquiries" | "conversion-rate";
export type EpccReportComponentId =
  | "monthly-profit"
  | "bonus-profit"
  | "ytd-summary"
  | "previous-year-ytd"
  | "ytd-target"
  | "target-variance"
  | "monthly-profit-comparison"
  | "active-marketing-enquiries"
  | "conversion-rate";

export type EpccReportTemplateComponent = {
  id: EpccReportComponentId;
  type: EpccReportComponentType;
  page: EpccReportPageId;
  region: EpccReportRegion;
  enabled: boolean;
  label: string;
  labels?: Partial<Record<"bonus" | "previousYear" | "target" | "varianceAbove" | "varianceBelow", string>>;
  order: number;
};

export type EpccReportTemplateComponentPresentationUpdate = Pick<Partial<EpccReportTemplateComponent>, "label" | "labels" | "enabled">;

export type EpccReportTemplate = {
  version: typeof EPCC_REPORT_TEMPLATE_VERSION;
  components: EpccReportTemplateComponent[];
};

export const DEFAULT_EPCC_REPORT_TEMPLATE: EpccReportTemplate = {
  version: EPCC_REPORT_TEMPLATE_VERSION,
  components: [
    { id: "monthly-profit", type: "monthly-profit", page: "company-profit", region: "company-profit", enabled: true, label: "Monthly Profit", order: 0 },
    { id: "bonus-profit", type: "bonus-profit", page: "company-profit", region: "company-profit", enabled: true, label: "Bonus Profit", order: 1 },
    { id: "ytd-summary", type: "ytd-summary", page: "year-to-date", region: "year-to-date-primary", enabled: true, label: "YTD Profit", order: 0 },
    { id: "previous-year-ytd", type: "previous-year-ytd", page: "year-to-date", region: "year-to-date-primary", enabled: true, label: "YTD", order: 1 },
    { id: "ytd-target", type: "ytd-target", page: "year-to-date", region: "year-to-date-primary", enabled: true, label: "YTD Target", order: 2 },
    { id: "target-variance", type: "target-variance", page: "year-to-date", region: "year-to-date-primary", enabled: true, label: "Above target", labels: { varianceBelow: "Below target" }, order: 3 },
    { id: "monthly-profit-comparison", type: "monthly-profit-comparison", page: "year-to-date", region: "year-to-date-primary", enabled: true, label: "Monthly Profit", order: 4 },
    { id: "active-marketing-enquiries", type: "active-marketing-enquiries", page: "year-to-date", region: "year-to-date-performance", enabled: true, label: "Active Marketing Enquiries", order: 0 },
    { id: "conversion-rate", type: "conversion-rate", page: "year-to-date", region: "year-to-date-performance", enabled: true, label: "Conversion Rate", order: 1 },
  ],
};

export function cloneEpccReportTemplate(template: EpccReportTemplate = DEFAULT_EPCC_REPORT_TEMPLATE): EpccReportTemplate {
  return { version: template.version, components: template.components.map((component) => ({ ...component })) };
}

export function orderedEpccReportComponents(template: EpccReportTemplate, page: EpccReportPageId, region: EpccReportRegion) {
  return template.components
    .filter((component) => component.enabled && component.page === page && component.region === region)
    .sort((left, right) => left.order - right.order);
}

export function updateEpccReportTemplateComponent(template: EpccReportTemplate, id: EpccReportComponentId, updates: EpccReportTemplateComponentPresentationUpdate): EpccReportTemplate {
  return {
    version: template.version,
    components: template.components.map((component) => component.id === id ? { ...component, ...updates } : { ...component }),
  };
}

export function moveEpccReportTemplateComponent(template: EpccReportTemplate, id: EpccReportComponentId, direction: "up" | "down"): EpccReportTemplate {
  const component = template.components.find((candidate) => candidate.id === id);
  if (!component) return cloneEpccReportTemplate(template);

  const group = template.components
    .filter((candidate) => candidate.page === component.page && candidate.region === component.region)
    .sort((left, right) => left.order - right.order);
  const index = group.findIndex((candidate) => candidate.id === id);
  const destinationIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || destinationIndex < 0 || destinationIndex >= group.length) return cloneEpccReportTemplate(template);

  const destination = group[destinationIndex];
  return {
    version: template.version,
    components: template.components.map((candidate) => {
      if (candidate.id === component.id) return { ...candidate, order: destination.order };
      if (candidate.id === destination.id) return { ...candidate, order: component.order };
      return { ...candidate };
    }),
  };
}
