
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

type RefetchPipelines = (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<Pipeline[], Error>>;
type RefetchLeads = (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<Lead[], Error>>;

export function usePipelineRefresh(
  refetchPipelines: RefetchPipelines,
  refetchLeads: RefetchLeads
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
