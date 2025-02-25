
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function usePipelineRefresh(
  refetchPipelines: () => Promise<void>,
  refetchLeads: () => Promise<void>
) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchPipelines(), refetchLeads()]);
    } catch (error) {
      console.error("Error refreshing:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return { isRefreshing, handleRefresh };
}
