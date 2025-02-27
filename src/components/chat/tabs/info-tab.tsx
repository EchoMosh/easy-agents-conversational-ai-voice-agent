
import { useNavigate } from "react-router-dom";
import { Pipeline } from "@/types/pipeline";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface InfoTabProps {
  pipeline?: Pipeline | null;
  lead?: any; // Adding lead prop to match usage
}

export function InfoTab({ pipeline, lead }: InfoTabProps) {
  const navigate = useNavigate();

  if (!pipeline) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No pipeline information available
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-medium mb-2">Pipeline</h3>
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => navigate(`/dashboard/pipelines/${pipeline.id}`)}
        >
          {pipeline.name}
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
