import { createContext, useContext, ReactNode } from "react";
import { useWorkspace as useWorkspaceHook } from "@/hooks/use-workspace";

const WorkspaceContext = createContext<ReturnType<typeof useWorkspaceHook> | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const workspace = useWorkspaceHook();
  return (
    <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
