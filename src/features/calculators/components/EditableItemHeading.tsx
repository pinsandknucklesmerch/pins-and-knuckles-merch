import { Pencil } from "lucide-react";
import { useRef } from "react";
import { getEuItemLabel } from "../domain/euQuoteFormatter.ts";

type EditableItemHeadingProps = {
  index: number;
  value?: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
};

export function EditableItemHeading({ index, value, onChange, onBlur }: EditableItemHeadingProps) {
  const fallback = getEuItemLabel(undefined, index);
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="flex min-w-0 items-center gap-1"><input ref={inputRef} aria-label={`Edit item name: ${getEuItemLabel(value, index)}`} title="Edit item name" value={value ?? ""} placeholder={fallback} onChange={(event) => onChange(event.target.value)} onBlur={(event) => onBlur(event.target.value.trim())} className="min-w-0 max-w-[16rem] flex-1 truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-foreground focus:border-input focus:bg-background focus:ring-2 focus:ring-ring" /><button type="button" aria-label="Edit item name" title="Edit item name" onClick={() => inputRef.current?.focus()} className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Pencil className="size-3.5" aria-hidden="true" /></button></div>;
}
