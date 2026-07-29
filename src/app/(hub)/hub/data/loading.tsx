import { LoadingState } from "@/components/ui/LoadingState";

export default function DataManagementLoading() {
  return <main className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8"><LoadingState label="Loading data management" /></main>;
}
