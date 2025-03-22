
import { useImport, ImportJob } from "@/context/import-context";
import { Check, Info, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export function ImportsIndicator() {
  const { importJobs, clearCompletedJobs } = useImport();
  const [open, setOpen] = useState(false);
  
  const activeImports = importJobs.filter(job => job.status === "processing");
  const completedImports = importJobs.filter(job => job.status === "completed");
  const failedImports = importJobs.filter(job => job.status === "failed");
  
  const hasActiveImports = activeImports.length > 0;
  const hasCompletedOrFailed = completedImports.length > 0 || failedImports.length > 0;
  
  if (importJobs.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              size="sm"
              variant={hasActiveImports ? "default" : hasCompletedOrFailed ? "outline" : "ghost"}
              className={`rounded-full shadow-lg ${hasActiveImports ? "bg-primary" : ""}`}
            >
              {hasActiveImports ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {activeImports.reduce((sum, job) => sum + (job.processed || 0), 0)}/
                    {activeImports.reduce((sum, job) => sum + job.leadCount, 0)} Leads
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>
                    {completedImports.length} import{completedImports.length !== 1 ? "s" : ""} completed
                    {failedImports.length > 0 ? `, ${failedImports.length} failed` : ""}
                  </span>
                </div>
              )}
            </Button>
          </motion.div>
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-lg shadow-lg" align="center">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-medium">Import Status</h3>
          {hasCompletedOrFailed && (
            <Button variant="ghost" size="sm" onClick={clearCompletedJobs} className="h-8">
              Clear Completed
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-96 overflow-y-auto p-2">
          {importJobs.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No import jobs found
            </div>
          ) : (
            <div className="space-y-2">
              {activeImports.map(job => (
                <ImportJobItem key={job.id} job={job} />
              ))}
              {completedImports.map(job => (
                <ImportJobItem key={job.id} job={job} />
              ))}
              {failedImports.map(job => (
                <ImportJobItem key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ImportJobItem({ job }: { job: ImportJob }) {
  const progress = job.processed !== undefined
    ? Math.min(100, Math.round((job.processed / job.leadCount) * 100))
    : 0;
    
  return (
    <div className="border rounded-md p-3 bg-card">
      <div className="flex justify-between items-center">
        <div className="font-medium truncate max-w-[200px]">{job.fileName}</div>
        <Badge
          variant="outline"
          className={`
            ${job.status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
            ${job.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : ""}
            ${job.status === "failed" ? "bg-red-50 text-red-700 border-red-200" : ""}
          `}
        >
          {job.status === "processing" && (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          )}
          {job.status === "completed" && (
            <Check className="h-3 w-3 mr-1" />
          )}
          {job.status === "failed" && (
            <X className="h-3 w-3 mr-1" />
          )}
          {job.status === "processing" ? "Processing..." : 
           job.status === "completed" ? "Completed" : "Failed"}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {job.leadCount} leads
      </div>
      {job.status === "processing" && job.processed !== undefined && (
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1 flex justify-between">
            <span>{job.processed} of {job.leadCount} leads</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}
      {job.startTime && (
        <div className="text-xs text-muted-foreground mt-1">
          Started: {format(job.startTime, "MMM d, h:mm a")}
        </div>
      )}
      {job.endTime && (
        <div className="text-xs text-muted-foreground">
          Completed: {format(job.endTime, "MMM d, h:mm a")}
        </div>
      )}
      {job.error && (
        <div className="text-xs text-red-600 mt-1">
          Error: {job.error}
        </div>
      )}
    </div>
  );
}
