export type TemporaryPasswordInput = {
  membershipId: string;
  password: string;
};

export function validateTemporaryPasswordInput(formData: FormData): TemporaryPasswordInput | { error: string } {
  const membershipId = String(formData.get("membership_id") ?? "").trim();
  if (!membershipId) return { error: "User could not be identified." };

  const password = String(formData.get("temporary_password") ?? "");
  const confirmation = String(formData.get("temporary_password_confirmation") ?? "");
  if (password.length < 8) return { error: "Temporary password must be at least 8 characters." };
  if (password !== confirmation) return { error: "Temporary passwords do not match." };

  return { membershipId, password };
}
