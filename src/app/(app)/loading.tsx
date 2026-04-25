import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
