import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingSpinner
        size="lg"
        text="The Grand Horizon Luxury Hotel & Resort"
        subtext="Synchronizing live operational records..."
      />
    </div>
  );
}
