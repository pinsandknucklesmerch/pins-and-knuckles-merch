"use server";

import { saveEpccReportTemplate } from "../lib/epccReportTemplatePersistence";
import type { EpccReportTemplate } from "../lib/epccReportTemplate";

export async function persistEpccReportTemplate(template: EpccReportTemplate) {
  return saveEpccReportTemplate(template);
}
