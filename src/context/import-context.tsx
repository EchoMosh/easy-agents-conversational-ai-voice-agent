import React, { createContext, useContext, useState, useEffect } from "react";

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

const LOCAL_STORAGE_KEY = 'lead_import_jobs';

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: React.ReactNode }) {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);

  // Load saved jobs from localStorage on initial mount
  useEffect(() => {
    try {
      const savedJobs = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs).map((job: any) => ({
          ...job,
          startTime: new Date(job.startTime),
          endTime: job.endTime ? new Date(job.endTime) : undefined
        }));
        
        // Keep processing jobs as is, they might still be running in another tab
        setImportJobs(parsedJobs);
      }
    } catch (error) {
      console.error("Error loading import jobs from localStorage:", error);
    }
  }, []);

  // Save jobs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(importJobs));
    } catch (error) {
      console.error("Error saving import jobs to localStorage:", error);
    }
  }, [importJobs]);

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
