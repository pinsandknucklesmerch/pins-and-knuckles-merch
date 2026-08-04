export type InvoiceCompanyFormValues = {
  label: string;
  companyName: string;
  contactName: string;
  country: string;
  eori: string;
  vatNumber: string;
  taxId: string;
  telephone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  notes: string;
};

export type ValidationResult<T> = {
  values: T | null;
  errors: Record<string, string>;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(errors: Record<string, string>, key: string, value: string, label: string) {
  if (!value.trim()) errors[key] = `${label} is required.`;
}

export function validateInvoiceCompany(values: InvoiceCompanyFormValues): ValidationResult<InvoiceCompanyFormValues> {
  const errors: Record<string, string> = {};
  required(errors, "label", values.label, "Label");
  required(errors, "companyName", values.companyName, "Company name");
  if (values.email && !emailPattern.test(values.email.trim())) errors.email = "Enter a valid email address.";
  return { values: Object.keys(errors).length ? null : values, errors };
}
