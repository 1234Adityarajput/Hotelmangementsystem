import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/health.service";

export function useHealthQuery() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => healthService.getHealth(),
    retry: 1,
    refetchInterval: 30000,
  });
}
