import { useEffect, useState } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { WorkspaceHeader } from '@/components/workspaces/WorkspaceHeader';
import { MembersList } from '@/components/workspaces/MembersList';

export function WorkspacePage() {
  const { currentWorkspace, isLoading } = useWorkspace();
  const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspace({
        id: currentWorkspace.id,
        name: currentWorkspace.name
      });
    }
  }, [currentWorkspace]);

  if (isLoading || !workspace) {
    return <div>Loading workspace...</div>;
  }

  return (
    <div className="workspace-page p-4">
      <WorkspaceHeader workspace={workspace} />
      <div className="mt-6">
        <MembersList workspaceId={workspace.id} />
      </div>
    </div>
  );
}
