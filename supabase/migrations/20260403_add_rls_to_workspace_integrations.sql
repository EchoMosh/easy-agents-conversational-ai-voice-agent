-- Enable RLS on workspace_integrations
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

-- Allow users to read integrations for workspaces they belong to
CREATE POLICY "Users can view integrations for their workspaces"
  ON public.workspace_integrations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow workspace owners/admins to manage integrations
CREATE POLICY "Workspace admins can manage integrations"
  ON public.workspace_integrations
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
