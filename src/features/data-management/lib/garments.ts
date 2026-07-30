import type { GarmentRecord } from "../types";

export type GarmentSortKey = "code" | "altCode" | "brand" | "name" | "productTypeName" | "eurBasePrice" | "gbpPrice" | "extraSizeCost";
export type SortDirection = "asc" | "desc";

export async function fetchAllGarmentPages<T>(fetchPage: (from: number, to: number) => Promise<T[]>, pageSize: number) {
  const records: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    records.push(...page);
    if (page.length < pageSize) return records;
  }
}

export function formatGarmentCurrency(value: number | null, currency: "EUR" | "GBP") {
  if (value === null) return "—";
  return `${currency === "EUR" ? "€" : "£"}${value.toFixed(2)}`;
}

export function nextGarmentSort(currentKey: GarmentSortKey, currentDirection: SortDirection, key: GarmentSortKey) {
  return key === currentKey
    ? { key, direction: currentDirection === "asc" ? "desc" : "asc" as SortDirection }
    : { key, direction: "asc" as SortDirection };
}

export function garmentAriaSort(active: boolean, direction: SortDirection): "none" | "ascending" | "descending" {
  return active ? direction === "asc" ? "ascending" : "descending" : "none";
}

export function sortGarments(garments: GarmentRecord[], key: GarmentSortKey, direction: SortDirection) {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...garments].sort((left, right) => {
    const leftValue = left[key];
    const rightValue = right[key];
    if (typeof leftValue === "number" || typeof rightValue === "number") return ((typeof leftValue === "number" ? leftValue : Number.NEGATIVE_INFINITY) - (typeof rightValue === "number" ? rightValue : Number.NEGATIVE_INFINITY)) * multiplier;
    if (typeof leftValue === "boolean" || typeof rightValue === "boolean") return (Number(Boolean(leftValue)) - Number(Boolean(rightValue))) * multiplier;
    return String(leftValue ?? "").localeCompare(String(rightValue ?? "")) * multiplier;
  });
}
