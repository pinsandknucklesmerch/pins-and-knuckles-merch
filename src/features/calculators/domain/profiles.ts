import type { CalculatorProfileCode } from "./types";

export const EU_STANDARD_PROFILE_CODE = "EU_STANDARD" satisfies CalculatorProfileCode;
export const EU_US_CLIENTS_PROFILE_CODE = "EU_US_CLIENTS" satisfies CalculatorProfileCode;
export const UK_TRADE_PROFILE_CODE = "UK_TRADE" satisfies CalculatorProfileCode;

export const EU_PROFILE_CODES = [
  EU_STANDARD_PROFILE_CODE,
  EU_US_CLIENTS_PROFILE_CODE,
] as const;

export const EU_QUANTITY_MIN = 50;
export const EU_QUANTITY_MAX = 2000;
export const EU_PRINT_COLOUR_MIN = 1;
export const EU_PRINT_COLOUR_MAX = 9;

export function isEuProfileCode(
  code: CalculatorProfileCode,
): code is (typeof EU_PROFILE_CODES)[number] {
  return EU_PROFILE_CODES.includes(code as (typeof EU_PROFILE_CODES)[number]);
}
