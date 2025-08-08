-- Add Row-Level Security policy to allow authenticated users to insert into workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_workspaces ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Optionally, allow users to view all workspaces they are members of
CREATE POLICY view_workspaces ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
