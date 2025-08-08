import { useState } from 'react';
import { InviteMemberModal } from './InviteMemberModal';

interface WorkspaceHeaderProps {
  workspace: {
    id: string;
    name: string;
  };
}

export function WorkspaceHeader({ workspace }: WorkspaceHeaderProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleInviteSuccess = () => {
    // Optionally refresh member list or show success message
    console.log('Member invited successfully!');
  };

  return (
    <div className="workspace-header">
      <h1>{workspace.name}</h1>
      
      <button
        onClick={() => setShowInviteModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Invite Members
      </button>

      <InviteMemberModal
        workspaceId={workspace.id}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
