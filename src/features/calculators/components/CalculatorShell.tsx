import { PageHeader } from "@/components/layout/PageHeader";

type CalculatorShellProps = {
  title: string;
  children: React.ReactNode;
};

export function CalculatorShell({ title, children }: CalculatorShellProps) {
  return (
    <>
      <PageHeader title={title} />
      {children}
    </>
  );
}
