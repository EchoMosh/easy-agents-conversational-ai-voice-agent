
import { useColumnMutations } from "./mutations/use-column-mutations";
import { usePipelineCreate } from "./mutations/use-pipeline-create";
import { usePipelineDelete } from "./mutations/use-pipeline-delete";
import { usePipelineName } from "./mutations/use-pipeline-name";

export function usePipelineMutations(refetchPipelines: () => void, refetchLeads: () => void) {
  const { handleEditColumnTitle } = useColumnMutations();
  const { createNewPipeline } = usePipelineCreate();
  const { handleDeletePipeline } = usePipelineDelete(refetchPipelines, refetchLeads);
  const { handleEditPipelineName, isUpdatingPipelineName } = usePipelineName();

  return {
    handleEditColumnTitle,
    createNewPipeline,
    handleDeletePipeline,
    handleEditPipelineName,
    isUpdatingPipelineName,
  };
}
