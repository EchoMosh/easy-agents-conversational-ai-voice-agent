import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

export function MembersList({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('workspace_id', workspaceId);

    if (data) setMembers(data as unknown as WorkspaceMember[]);
  };

  return (
    <div className="members-list">
      <h3>Team Members</h3>
      {members.map(member => (
        <div key={member.id} className="member-item p-2 border-b">
          <span>{member.profiles?.email || 'Unknown Email'}</span>
          <span className="text-sm text-gray-500 ml-2">({member.role})</span>
        </div>
      ))}
    </div>
  );
}
