export function normaliseUkStandardColourInput(value: string, max = 9) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  return String(Math.min(Number(digits), max));
}

export function normaliseUkStandardDecimalInput(value: string) {
  let result = "";
  let hasDecimal = false;
  for (const [index, character] of [...value].entries()) {
    if (/\d/.test(character)) result += character;
    else if (character === "-" && index === 0 && result === "") result = "-";
    else if (character === "." && !hasDecimal) {
      result += ".";
      hasDecimal = true;
    }
  }
  return result;
}
