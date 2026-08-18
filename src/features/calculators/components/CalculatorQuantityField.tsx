import type { InputHTMLAttributes } from "react";

type CalculatorQuantityFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export function CalculatorQuantityField(props: CalculatorQuantityFieldProps) {
  return <label className="grid gap-2 text-xs font-medium text-muted-foreground">Quantity<input {...props} className="hub-native-control" /></label>;
}
