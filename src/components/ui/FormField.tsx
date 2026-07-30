import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formFieldClassName } from "./styles";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  label?: ReactNode;
  error?: ReactNode;
  id?: string;
};

export function FormField({ children, className, label, error, id }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hasLabel = typeof label === "string" ? label.trim().length > 0 : Boolean(label);

  const control = isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children)
    ? cloneElement(children, {
      id: children.props.id ?? fieldId,
      "aria-describedby": error ? children.props["aria-describedby"] ?? `${fieldId}-error` : children.props["aria-describedby"],
      "aria-invalid": error ? true : children.props["aria-invalid"],
    })
    : children;

  return (
    <div className={cn(formFieldClassName, className)}>
      {hasLabel ? <label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">{label}</label> : null}
      {control}
      {error ? <p id={`${fieldId}-error`} className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
