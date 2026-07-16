import type { CalculatorValidationError } from "../domain/types.ts";

type CalculatorErrorsProps = {
  errors: CalculatorValidationError[];
};

export function CalculatorErrors({ errors }: CalculatorErrorsProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-destructive-foreground">
        Errors
      </div>
      <ul className="mt-2 space-y-1 text-sm text-foreground">
        {errors.map((error, index) => (
          <li key={`${error.code}-${error.field ?? "item"}-${index}`}>
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
