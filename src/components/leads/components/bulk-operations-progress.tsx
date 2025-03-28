import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useImport } from "@/context/import-context";
import { useDelete } from "@/context/delete-context";
import { X, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BulkOperationsProgress() {
  const { importJobs, clearCompletedJobs: clearCompletedImportJobs } =
    useImport();
  const { deleteJobs, clearCompletedJobs: clearCompletedDeleteJobs } =
    useDelete();

  // State for animating out notifications
  const [fadeOutJobs, setFadeOutJobs] = useState<Set<string>>(new Set());

  // Only show active or recently completed/failed jobs
  const filteredImportJobs = importJobs.filter(
    (job) =>
      job.status === "processing" ||
      (job.endTime && Date.now() - job.endTime.getTime() < 10000)
  );

  const filteredDeleteJobs = deleteJobs.filter(
    (job) =>
      job.status === "processing" ||
      (job.endTime && Date.now() - job.endTime.getTime() < 10000)
  );

  const hasActiveJobs =
    filteredImportJobs.length > 0 || filteredDeleteJobs.length > 0;

  const dismissJob = (jobId: string) => {
    // Add job to fadeout set for animation
    setFadeOutJobs((prev) => new Set(prev).add(jobId));

    // Remove after animation completes
    setTimeout(() => {
      if (jobId.startsWith("import-")) {
        clearCompletedImportJobs();
      } else {
        clearCompletedDeleteJobs();
      }
    }, 300);
  };

  if (!hasActiveJobs) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full space-y-2">
      {filteredImportJobs.map((job) => (
        <div
          key={job.id}
          className={`bg-white rounded-lg shadow-lg p-4 border border-gray-200 transition-opacity duration-300 ${
            fadeOutJobs.has(job.id) ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-sm">
                Importing {job.fileName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dismissJob(job.id)}
              disabled={job.status === "processing"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {job.status === "processing"
                  ? `Processed ${job.processed || 0} of ${job.leadCount} leads`
                  : job.status === "completed"
                  ? "Import completed"
                  : "Import failed"}
              </span>
              {job.status === "processing" && (
                <span>
                  {Math.round(((job.processed || 0) / job.leadCount) * 100)}%
                </span>
              )}
            </div>
            <Progress
              value={
                job.status === "processing"
                  ? ((job.processed || 0) / job.leadCount) * 100
                  : job.status === "completed"
                  ? 100
                  : 0
              }
              className={`h-1 ${job.status === "failed" ? "bg-red-200" : ""}`}
            />
          </div>
        </div>
      ))}

      {filteredDeleteJobs.map((job) => (
        <div
          key={job.id}
          className={`bg-white rounded-lg shadow-lg p-4 border border-gray-200 transition-opacity duration-300 ${
            fadeOutJobs.has(job.id) ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="font-medium text-sm">Deleting leads</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dismissJob(job.id)}
              disabled={job.status === "processing"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {job.status === "processing"
                  ? `Deleted ${job.processed || 0} of ${job.leadCount} leads`
                  : job.status === "completed"
                  ? "Delete completed"
                  : "Delete failed"}
              </span>
              {job.status === "processing" && (
                <span>
                  {Math.round(((job.processed || 0) / job.leadCount) * 100)}%
                </span>
              )}
            </div>
            <Progress
              value={
                job.status === "processing"
                  ? ((job.processed || 0) / job.leadCount) * 100
                  : job.status === "completed"
                  ? 100
                  : 0
              }
              className={`h-1 ${job.status === "failed" ? "bg-red-200" : ""}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
