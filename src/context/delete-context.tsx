import React, { createContext, useContext, useState, useEffect } from "react";

export interface DeleteJob {
  id: string;
  status: "processing" | "completed" | "failed";
  leadCount: number;
  startTime: Date;
  endTime?: Date;
  processed?: number;
  error?: string;
}

interface DeleteContextType {
  deleteJobs: DeleteJob[];
  addDeleteJob: (job: Omit<DeleteJob, "id" | "startTime">) => string;
  updateDeleteJobStatus: (id: string, updates: Partial<DeleteJob>) => void;
  clearCompletedJobs: () => void;
}

const LOCAL_STORAGE_KEY = "lead_delete_jobs";

const DeleteContext = createContext<DeleteContextType | undefined>(undefined);

export function DeleteProvider({ children }: { children: React.ReactNode }) {
  const [deleteJobs, setDeleteJobs] = useState<DeleteJob[]>([]);

  // Load saved jobs from localStorage on initial mount
  useEffect(() => {
    try {
      const savedJobs = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs).map((job: any) => ({
          ...job,
          startTime: new Date(job.startTime),
          endTime: job.endTime ? new Date(job.endTime) : undefined,
        }));

        // Keep processing jobs as is, they might still be running in another tab
        setDeleteJobs(parsedJobs);
      }
    } catch (error) {
      console.error("Error loading delete jobs from localStorage:", error);
    }
  }, []);

  // Save jobs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(deleteJobs));
    } catch (error) {
      console.error("Error saving delete jobs to localStorage:", error);
    }
  }, [deleteJobs]);

  const addDeleteJob = (job: Omit<DeleteJob, "id" | "startTime">) => {
    const id = `delete-${Date.now()}`;
    const newJob: DeleteJob = {
      ...job,
      id,
      startTime: new Date(),
    };
    setDeleteJobs((prev) => [...prev, newJob]);
    return id;
  };

  const updateDeleteJobStatus = (id: string, updates: Partial<DeleteJob>) => {
    setDeleteJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  };

  const clearCompletedJobs = () => {
    setDeleteJobs((prev) => prev.filter((job) => job.status === "processing"));
  };

  return (
    <DeleteContext.Provider
      value={{
        deleteJobs,
        addDeleteJob,
        updateDeleteJobStatus,
        clearCompletedJobs,
      }}
    >
      {children}
    </DeleteContext.Provider>
  );
}

export function useDelete() {
  const context = useContext(DeleteContext);
  if (context === undefined) {
    throw new Error("useDelete must be used within a DeleteProvider");
  }
  return context;
}
