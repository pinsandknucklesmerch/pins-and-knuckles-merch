export type ProfileDetails = {
  displayName: string;
  email: string;
  organisation: string;
  accessRole: string;
};

export type ProfileActionState = {
  ok: boolean;
  message?: string;
  fieldError?: string;
};
