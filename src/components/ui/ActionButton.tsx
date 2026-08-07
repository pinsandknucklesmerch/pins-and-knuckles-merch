import Link from "next/link";
import { cn } from "@/lib/utils";

type ActionButtonBaseProps = {
  children: React.ReactNode;
  className?: string;
};

export type ActionButtonProps =
  | (ActionButtonBaseProps & {
      href?: never;
      onClick?: () => void;
      type?: "button" | "submit";
      disabled?: boolean;
    })
  | (ActionButtonBaseProps & {
      href: string;
      disabled?: boolean;
      onClick?: never;
      type?: never;
    });

export function ActionButton({
  children,
  className,
  href,
  onClick,
  type = "button",
  disabled = false,
}: ActionButtonProps) {
  const classes = cn(
    "inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={cn(classes, disabled && "pointer-events-none cursor-not-allowed opacity-50")}
        onClick={disabled ? (event) => event.preventDefault() : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
