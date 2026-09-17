export type QuickReferenceFormValues = {
  title: string;
  category: string;
  body: string;
  warning: string | null;
  displayOrder: number;
};

export function validateQuickReference(formData: FormData): {
  values: QuickReferenceFormValues | null;
  errors: Record<string, string>;
} {
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const warningValue = String(formData.get("warning") ?? "");
  const displayOrderValue = String(formData.get("displayOrder") ?? "").trim();
  const errors: Record<string, string> = {};

  if (!title) errors.title = "Title is required.";
  if (!category) errors.category = "Category is required.";
  if (!body.trim()) errors.body = "Body is required.";
  if (!/^-?\d+$/.test(displayOrderValue) || !Number.isSafeInteger(Number(displayOrderValue))) {
    errors.displayOrder = "Display order must be an integer.";
  } else if (Number(displayOrderValue) < 0) {
    errors.displayOrder = "Display order cannot be negative.";
  }

  if (Object.keys(errors).length) return { values: null, errors };

  return {
    values: {
      title,
      category,
      body,
      warning: warningValue.trim() ? warningValue : null,
      displayOrder: Number(displayOrderValue),
    },
    errors,
  };
}

export function quickReferenceId(formData: FormData): string | null {
  const value = String(formData.get("id") ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}
