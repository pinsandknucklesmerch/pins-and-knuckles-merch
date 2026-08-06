import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { controlClassName, freeEntryNumberClassName } from "./styles";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClassName, "h-9", className)} {...props} />;
});

export const NumberInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function NumberInput({ type = "number", className, ...props }, ref) {
  return <Input ref={ref} type={type} className={cn(freeEntryNumberClassName, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlClassName, "min-h-20 resize-y", className)} {...props} />;
});

type CurrencyInputProps = InputHTMLAttributes<HTMLInputElement> & { currency: string };

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput({ className, currency, ...props }, ref) {
  return <div className="flex min-w-0 items-stretch"><span aria-hidden="true" className="inline-flex h-9 shrink-0 items-center rounded-l-md border border-r-0 border-input bg-secondary px-3 text-sm text-muted-foreground">{currency}</span><input ref={ref} inputMode="decimal" className={cn(controlClassName, "h-9 rounded-l-none", className)} {...props} /></div>;
});
