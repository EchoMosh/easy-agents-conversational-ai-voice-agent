import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, withWorkspace } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { useWorkspace } from "@/context/workspace-context";
import { useState, useEffect } from "react";

export function usePipelineQueries(selectedPipelineId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const [totalFilteredCount, setTotalFilteredCount] = useState<number | null>(
    null,
  );

  const {
    data: pipelines = [],
    isLoading: isPipelinesLoading,
    refetch: refetchPipelines,
  } = useQuery({
    queryKey: ["pipelines", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      try {
        const { data, error } = await supabase
          .from("pipelines")
          .select("*")
          .eq("workspace_id", currentWorkspace.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching pipelines:", error);
          toast.error("Failed to load pipelines");
          throw error;
        }

        return (data || []).map(convertJsonToPipeline);
      } catch (error) {
        console.error("Exception in pipelines query:", error);
        return [];
      }
    },
    enabled: !!currentWorkspace?.id,
  });

  const { data: availableTags = [], isLoading: isTagsLoading } = useQuery({
    queryKey: ["tags", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      try {
        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("workspace_id", currentWorkspace.id)
          .order("name");

        if (error) {
          console.error("Error fetching tags:", error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error("Exception in tags query:", error);
        return [];
      }
    },
    enabled: !!currentWorkspace?.id,
  });

  useEffect(() => {
    const fetchTotalCount = async () => {
      if (!currentWorkspace?.id) return;

      try {
        let query = supabase
          .from("leads")
          .select("id", { count: "exact" })
          .eq("workspace_id", currentWorkspace.id);

        if (selectedPipelineId && selectedPipelineId !== "all") {
          query = query.eq("pipeline_id", selectedPipelineId);
        }

        const { count, error } = await query;

        if (error) {
          console.error("Failed to fetch total count", error);
          return;
        }

        if (count !== null) {
          setTotalFilteredCount(count);

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("totalFilteredLeads", { detail: count }),
            );
          }
        }
      } catch (error) {
        console.error("Error fetching total count:", error);
      }
    };

    fetchTotalCount();
  }, [currentWorkspace?.id, selectedPipelineId]);

  const {
    data: leads = [],
    isLoading: isLeadsLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads", selectedPipelineId, currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) {
        return [];
      }

      try {
        let query = supabase
          .from("leads")
          .select(
            `
            *,
            variables:lead_variables(*),
            tags:lead_tags(
              lead_id,
              tag_id,
              tags:tags(*)
            )
          `,
          )
          .eq("workspace_id", currentWorkspace.id);

        if (selectedPipelineId && selectedPipelineId !== "all") {
          query = query.eq("pipeline_id", selectedPipelineId);
        }

        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error("Supabase error fetching leads:", error);
          toast.error("Failed to load leads");
          throw error;
        }

        if (data.length === 0) {
          return [];
        }

        if (!data || !Array.isArray(data)) {
          console.error(
            "Invalid data structure returned from leads query:",
            data,
          );
          return [];
        }

        try {
          const transformedLeads = data.map((lead) => {
            if (!lead) {
              console.warn("Received null/undefined lead in data array");
              return null;
            }

            try {
              const tags = (lead.tags || [])
                .filter((tagRel) => tagRel && tagRel.tags)
                .map((tagRel) => {
                  const tag = tagRel.tags;
                  const validColors = [
                    "gray",
                    "red",
                    "yellow",
                    "green",
                    "blue",
                    "purple",
                    "pink",
                  ];
                  let color = tag.color || "gray";
                  if (!validColors.includes(color)) {
                    color = "gray";
                  }

                  return {
                    id: tag.id || crypto.randomUUID(),
                    name: tag.name || "Unnamed Tag",
                    color: color as
                      | "gray"
                      | "red"
                      | "yellow"
                      | "green"
                      | "blue"
                      | "purple"
                      | "pink",
                    user_id: tag.user_id || lead.user_id,
                  };
                });

              return {
                ...lead,
                tags,
              };
            } catch (error) {
              console.error("Error processing lead:", lead.id, error);
              return {
                ...lead,
                tags: [],
              };
            }
          });

          return transformedLeads as Lead[];
        } catch (error) {
          console.error("Error transforming lead data:", error);
          return [];
        }
      } catch (error) {
        console.error("Exception in leads query:", error);
        return [];
      }
    },
    enabled: !!currentWorkspace?.id,
  });

  const isLoading = isPipelinesLoading || isLeadsLoading || isTagsLoading;

  const invalidateAndRefetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    await queryClient.invalidateQueries({ queryKey: ["leads"] });
    await queryClient.invalidateQueries({ queryKey: ["tags"] });
    await refetchPipelines();
    await refetchLeads();
  };

  return {
    pipelines,
    leads,
    availableTags,
    isLoading,
    isPipelinesLoading,
    isLeadsLoading,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
    totalFilteredCount,
  };
}
