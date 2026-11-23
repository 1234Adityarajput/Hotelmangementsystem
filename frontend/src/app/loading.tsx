import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function Loading() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-500 mt-2">Loading environment status...</p>
    </div>
  );
}
