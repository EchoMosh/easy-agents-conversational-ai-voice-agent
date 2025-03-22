
import React, { createContext, useContext, useState } from "react";

export interface ImportJob {
  id: string;
  status: "processing" | "completed" | "failed";
  fileName: string;
  leadCount: number;
  startTime: Date;
  endTime?: Date;
  processed?: number;
  error?: string;
}

interface ImportContextType {
  importJobs: ImportJob[];
  addImportJob: (job: Omit<ImportJob, "id" | "startTime">) => string;
  updateImportJobStatus: (id: string, updates: Partial<ImportJob>) => void;
  clearCompletedJobs: () => void;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: React.ReactNode }) {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);

  const addImportJob = (job: Omit<ImportJob, "id" | "startTime">) => {
    const id = `import-${Date.now()}`;
    const newJob: ImportJob = {
      ...job,
      id,
      startTime: new Date(),
    };
    setImportJobs((prev) => [...prev, newJob]);
    return id;
  };

  const updateImportJobStatus = (id: string, updates: Partial<ImportJob>) => {
    setImportJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      )
    );
  };

  const clearCompletedJobs = () => {
    setImportJobs((prev) => 
      prev.filter((job) => job.status === "processing")
    );
  };

  return (
    <ImportContext.Provider
      value={{ importJobs, addImportJob, updateImportJobStatus, clearCompletedJobs }}
    >
      {children}
    </ImportContext.Provider>
  );
}

export function useImport() {
  const context = useContext(ImportContext);
  if (context === undefined) {
    throw new Error("useImport must be used within an ImportProvider");
  }
  return context;
}
