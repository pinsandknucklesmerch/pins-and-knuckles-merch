export const SNUGGLE_FAILURE_CATEGORIES = [
  "missing configuration",
  "authentication failure",
  "board/workspace validation failure",
  "GraphQL response failure",
  "invalid FormulaValue response",
] as const;

export type SnuggleFailureCategory = typeof SNUGGLE_FAILURE_CATEGORIES[number];

export class SnuggleServiceError extends Error {
  readonly category: SnuggleFailureCategory;

  constructor(category: SnuggleFailureCategory) {
    super(category);
    this.name = "SnuggleServiceError";
    this.category = category;
  }
}

export function getSnuggleFailureCategory(error: unknown): SnuggleFailureCategory {
  return error instanceof SnuggleServiceError ? error.category : "GraphQL response failure";
}
