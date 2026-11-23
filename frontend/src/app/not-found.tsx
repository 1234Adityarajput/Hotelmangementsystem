import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-[#E3D9CA]">
      <h2 className="text-3xl font-bold text-[#362A22] mb-2">404</h2>
      <p className="text-base text-[#79695B] mb-6">Page Not Found</p>
      <Button asChild>
        <Link href="/">Return to Verification Page</Link>
      </Button>
    </div>
  );
}
