import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

export interface Workspace {
  id: string;
  name: string;
  icon: string;
}

export function useWorkspace() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['workspace', session?.user.id],
    enabled: !!session,
    retry: 3,
    queryFn: async () => {
      if (!session) return { current: null as Workspace | null, workspaces: [] as Workspace[] };

      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', session.user.id);
      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        return { current: null, workspaces: [] };
      }

      const workspaceIds = memberData.map((m) => m.workspace_id);
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);
      if (workspacesError) throw workspacesError;

      const mapped = workspacesData.map((w) => ({
        id: w.id,
        name: w.name,
        icon: w.icon || 'building',
      }));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      const current =
        mapped.find((w) => w.id === profile?.current_workspace_id) || mapped[0] || null;

      return { current, workspaces: mapped };
    },
  });
}
