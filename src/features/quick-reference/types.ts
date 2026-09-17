export type QuickReferenceRecord = {
  id: string;
  title: string;
  category: string;
  body: string;
  warning: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type QuickReferenceActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export const initialQuickReferenceActionState: QuickReferenceActionState = { ok: false, message: "" };
