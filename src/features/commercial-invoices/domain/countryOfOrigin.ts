import type { InvoiceLineItem } from "./types.ts";

export type OriginRule =
  | { mode: "fixed"; country: string }
  | { mode: "variable"; countries: string[] }
  | { mode: "unknown" };

export function getOriginRule(item: InvoiceLineItem): OriginRule {
  const product = [item.product, item.type, item.description].join(" ");
  if (/\b(?:westford\s+mill\s+)?w101\b/i.test(product)) {
    return { mode: "fixed", country: "China" };
  }
  if (/\bgildan\b/i.test(product)) {
    return {
      mode: "variable",
      countries: ["Bangladesh", "Honduras", "Nicaragua", "Haiti"],
    };
  }
  return { mode: "unknown" };
}

export function applyOriginRule(item: InvoiceLineItem): InvoiceLineItem {
  const rule = getOriginRule(item);
  return rule.mode === "fixed" && !item.countryOfOrigin.trim()
    ? { ...item, countryOfOrigin: rule.country }
    : item;
}
