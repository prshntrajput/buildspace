import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-lg space-y-6">
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-48 mx-auto" />
      </div>
    </div>
  );
}
