-- Auto-create a default "Sales Pipeline" with 7 stages when a workspace is created
CREATE OR REPLACE FUNCTION "public"."create_default_pipeline"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.pipelines (name, user_id, workspace_id, columns)
  VALUES (
    'Sales Pipeline',
    NEW.owner_id,
    NEW.id,
    '[
      {"id": "1", "title": "New", "color": "bg-blue-500", "items": []},
      {"id": "2", "title": "Contacted", "color": "bg-yellow-500", "items": []},
      {"id": "3", "title": "Qualified", "color": "bg-green-500", "items": []},
      {"id": "4", "title": "Proposal", "color": "bg-purple-500", "items": []},
      {"id": "5", "title": "Negotiation", "color": "bg-indigo-500", "items": []},
      {"id": "6", "title": "Won", "color": "bg-emerald-500", "items": []},
      {"id": "7", "title": "Lost", "color": "bg-red-500", "items": []}
    ]'::jsonb
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "workspace_default_pipeline_trigger"
  AFTER INSERT ON "public"."workspaces"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."create_default_pipeline"();
