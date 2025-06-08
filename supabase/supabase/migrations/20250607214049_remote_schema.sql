

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activity_type" AS ENUM (
    'note',
    'status_change',
    'contact_update',
    'name_update',
    'variable_add'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."agent_role" AS ENUM (
    'receptionist',
    'sales_agent',
    'customer_support',
    'technical_advisor',
    'appointment_scheduler',
    'product_specialist',
    'virtual_assistant'
);


ALTER TYPE "public"."agent_role" OWNER TO "postgres";


CREATE TYPE "public"."lead_status" AS ENUM (
    'new',
    'contacted',
    'qualified',
    'converted',
    'lost'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE TYPE "public"."tag_color" AS ENUM (
    'gray',
    'red',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink'
);


ALTER TYPE "public"."tag_color" OWNER TO "postgres";


CREATE TYPE "public"."workspace_role" AS ENUM (
    'owner',
    'admin',
    'member'
);


ALTER TYPE "public"."workspace_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_workspace_owner_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert the owner as a member with owner role, bypassing RLS
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_workspace_owner_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_lead_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Handle status change
    IF OLD.status != NEW.status THEN
        INSERT INTO lead_activities (lead_id, user_id, content, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'Status changed', OLD.status, NEW.status);
    END IF;

    -- Handle phone number change
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
        INSERT INTO lead_activities (lead_id, user_id, content, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'Phone number updated', OLD.phone, NEW.phone);
    END IF;

    -- Handle email change
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        INSERT INTO lead_activities (lead_id, user_id, content, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'Email updated', OLD.email, NEW.email);
    END IF;

    -- Handle name change
    IF OLD.name != NEW.name THEN
        INSERT INTO lead_activities (lead_id, user_id, content, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'Name updated', OLD.name, NEW.name);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_lead_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_lead_pipeline_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert activity for lead being removed due to pipeline deletion
    INSERT INTO lead_activities (lead_id, user_id, content, old_value, new_value)
    VALUES (OLD.id, auth.uid(), 'Lead removed due to pipeline deletion', OLD.pipeline_id, NULL);
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_lead_pipeline_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_lead_tag_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the tag name for the activity log
    INSERT INTO lead_activities (lead_id, user_id, content, new_value)
    SELECT NEW.lead_id, auth.uid(), 'Tag added', tags.name
    FROM tags WHERE tags.id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the tag name for the activity log
    INSERT INTO lead_activities (lead_id, user_id, content, old_value)
    SELECT OLD.lead_id, auth.uid(), 'Tag removed', tags.name
    FROM tags WHERE tags.id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."handle_lead_tag_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_lead"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO lead_activities (lead_id, user_id, content, created_at)
    VALUES (NEW.id, auth.uid(), 'Lead created', NEW.created_at);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_lead"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert a new row into the profiles table
    INSERT INTO public.profiles (
        id,
        email,
        username,
        avatar_url,
        created_at
    ) VALUES (
        NEW.id,                          -- Use the auth user ID as the profile ID
        NEW.email,                       -- Copy the email address
        COALESCE(                        -- Use the raw_user_meta_data username if available
            NEW.raw_user_meta_data->>'username',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',  -- Copy avatar if available
        NOW()                            -- Current timestamp
    );

    RAISE NOTICE 'Created profile for user: %', NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creating profile for user %: %', NEW.email, SQLERRM;
        RETURN NEW; -- Still return NEW to allow the auth user to be created
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_variable"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO lead_activities (lead_id, user_id, content, old_value, new_value)
    VALUES (NEW.lead_id, auth.uid(), 'Variable added', null, NEW.name || ': ' || NEW.value);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_variable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_variable_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF OLD.name != NEW.name OR OLD.value != NEW.value THEN
        INSERT INTO lead_activities (lead_id, user_id, content, old_value, new_value)
        VALUES (NEW.lead_id, auth.uid(), 'Variable updated', 
                OLD.name || ': ' || OLD.value,
                NEW.name || ': ' || NEW.value);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_variable_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_member"("workspace_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = $1 AND user_id = $2
  );
END;
$_$;


ALTER FUNCTION "public"."is_workspace_member"("workspace_id" "uuid", "user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agent_knowledge" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid",
    "knowledge_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agent_knowledge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_training_examples" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_message" "text" NOT NULL,
    "ai_response" "text" NOT NULL,
    "corrected_response" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_processed" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."agent_training_examples" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "role" "public"."agent_role" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "voice_id" "text",
    "is_active" boolean DEFAULT true,
    "interaction_type" "text"[] DEFAULT ARRAY['inbound'::"text"] NOT NULL,
    "flow" "jsonb",
    "objective" "text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text",
    "knowledge_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "humor_level" integer,
    "mermaid_chart" "text",
    "elevenlabs_agent_id" "text",
    "v_agent_id" "text",
    "workspace_id" "uuid",
    "creation_mode" "text",
    "knowledgeBaseId" "text",
    "max_duration_seconds" bigint
);

ALTER TABLE ONLY "public"."agents" REPLICA IDENTITY FULL;


ALTER TABLE "public"."agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "workspace_id" "uuid"
);


ALTER TABLE "public"."knowledge_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lead_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lead_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_tags" (
    "lead_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lead_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_variables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lead_variables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "status" "text" DEFAULT 'new'::"public"."lead_status",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "pipeline_id" "uuid",
    "workspace_id" "uuid"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "columns" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "workspace_id" "uuid"
);


ALTER TABLE "public"."pipelines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "business_type" "text",
    "employee_count" "text",
    "onboarding_completed" boolean DEFAULT false,
    "email" "text",
    "current_workspace_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "public"."tag_color" DEFAULT 'gray'::"public"."tag_color",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "workspace_id" "uuid"
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voice_previews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "voice_id" "text" NOT NULL,
    "voice_name" "text" NOT NULL,
    "preview_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."voice_previews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."workspace_role" DEFAULT 'member'::"public"."workspace_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "icon" "text" DEFAULT 'building'::"text" NOT NULL,
    "owner_id" "uuid" NOT NULL
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agent_knowledge"
    ADD CONSTRAINT "agent_knowledge_agent_id_knowledge_id_key" UNIQUE ("agent_id", "knowledge_id");



ALTER TABLE ONLY "public"."agent_knowledge"
    ADD CONSTRAINT "agent_knowledge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_training_examples"
    ADD CONSTRAINT "agent_training_examples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_notes"
    ADD CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_tags"
    ADD CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("lead_id", "tag_id");



ALTER TABLE ONLY "public"."lead_variables"
    ADD CONSTRAINT "lead_variables_lead_id_name_key" UNIQUE ("lead_id", "name");



ALTER TABLE ONLY "public"."lead_variables"
    ADD CONSTRAINT "lead_variables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_user_id_key" UNIQUE ("name", "user_id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voice_previews"
    ADD CONSTRAINT "voice_previews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voice_previews"
    ADD CONSTRAINT "voice_previews_voice_id_key" UNIQUE ("voice_id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_user_id_key" UNIQUE ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "agent_training_examples_agent_id_idx" ON "public"."agent_training_examples" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_knowledge_agent_id" ON "public"."agent_knowledge" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_knowledge_knowledge_id" ON "public"."agent_knowledge" USING "btree" ("knowledge_id");



CREATE INDEX "idx_elevenlabs_agent_id" ON "public"."agents" USING "btree" ("elevenlabs_agent_id");



CREATE INDEX "idx_voice_previews_voice_id" ON "public"."voice_previews" USING "btree" ("voice_id");



CREATE INDEX "lead_variables_lead_id_idx" ON "public"."lead_variables" USING "btree" ("lead_id");



CREATE OR REPLACE TRIGGER "on_lead_change" AFTER UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."handle_lead_change"();



CREATE OR REPLACE TRIGGER "on_lead_create" AFTER INSERT ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_lead"();



CREATE OR REPLACE TRIGGER "on_lead_delete" BEFORE DELETE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."handle_lead_pipeline_delete"();



CREATE OR REPLACE TRIGGER "on_lead_tag_add" AFTER INSERT ON "public"."lead_tags" FOR EACH ROW EXECUTE FUNCTION "public"."handle_lead_tag_change"();



CREATE OR REPLACE TRIGGER "on_lead_tag_remove" AFTER DELETE ON "public"."lead_tags" FOR EACH ROW EXECUTE FUNCTION "public"."handle_lead_tag_change"();



CREATE OR REPLACE TRIGGER "on_variable_add" AFTER INSERT ON "public"."lead_variables" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_variable"();



CREATE OR REPLACE TRIGGER "on_variable_change" AFTER UPDATE ON "public"."lead_variables" FOR EACH ROW EXECUTE FUNCTION "public"."handle_variable_change"();



CREATE OR REPLACE TRIGGER "workspace_owner_member_trigger" AFTER INSERT ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."add_workspace_owner_member"();



ALTER TABLE ONLY "public"."agent_knowledge"
    ADD CONSTRAINT "agent_knowledge_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_knowledge"
    ADD CONSTRAINT "agent_knowledge_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_training_examples"
    ADD CONSTRAINT "agent_training_examples_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_notes"
    ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_tags"
    ADD CONSTRAINT "lead_tags_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_tags"
    ADD CONSTRAINT "lead_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_variables"
    ADD CONSTRAINT "lead_variables_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_current_workspace_id_fkey" FOREIGN KEY ("current_workspace_id") REFERENCES "public"."workspaces"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow users to create their own documents" ON "public"."knowledge_documents" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to delete their own documents" ON "public"."knowledge_documents" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update their own documents" ON "public"."knowledge_documents" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to view their own documents" ON "public"."knowledge_documents" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can create their own workspaces" ON "public"."workspaces" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can create voice previews" ON "public"."voice_previews" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can delete their lead variables" ON "public"."lead_variables" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_variables"."lead_id") AND ("leads"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own agents" ON "public"."agents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own lead notes" ON "public"."lead_notes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own leads" ON "public"."leads" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own training examples" ON "public"."agent_training_examples" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their lead variables" ON "public"."lead_variables" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_variables"."lead_id") AND ("leads"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own activities" ON "public"."lead_activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own agents" ON "public"."agents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own lead notes" ON "public"."lead_notes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own leads" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own training examples" ON "public"."agent_training_examples" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage tags for their leads" ON "public"."lead_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_tags"."lead_id") AND ("leads"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own pipelines" ON "public"."pipelines" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own tags" ON "public"."tags" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read their own training examples" ON "public"."agent_training_examples" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their lead variables" ON "public"."lead_variables" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_variables"."lead_id") AND ("leads"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own agents" ON "public"."agents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own agents in real-time" ON "public"."agents" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own lead notes" ON "public"."lead_notes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own leads" ON "public"."leads" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own training examples" ON "public"."agent_training_examples" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update voice previews" ON "public"."voice_previews" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Users can view agents in their workspaces" ON "public"."agents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."workspace_id" = "agents"."workspace_id") AND ("workspace_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view leads in their workspaces" ON "public"."leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."workspace_id" = "leads"."workspace_id") AND ("workspace_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view pipelines in their workspaces" ON "public"."pipelines" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."workspace_id" = "pipelines"."workspace_id") AND ("workspace_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their lead variables" ON "public"."lead_variables" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_variables"."lead_id") AND ("leads"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own activities" ON "public"."lead_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own agents" ON "public"."agents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own lead notes" ON "public"."lead_notes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own leads" ON "public"."leads" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their workspace memberships" ON "public"."workspace_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view voice previews" ON "public"."voice_previews" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view workspace members for workspaces they belong to" ON "public"."workspace_members" FOR SELECT USING (("workspace_id" IN ( SELECT "workspace_members_1"."workspace_id"
   FROM "public"."workspace_members" "workspace_members_1"
  WHERE ("workspace_members_1"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view workspaces they are members of" ON "public"."workspaces" FOR SELECT USING (("id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view workspaces they own" ON "public"."workspaces" FOR SELECT USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Workspace owners and admins can manage members" ON "public"."workspace_members" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "workspace_members_1"
  WHERE (("workspace_members_1"."workspace_id" = "workspace_members"."workspace_id") AND ("workspace_members_1"."user_id" = "auth"."uid"()) AND ("workspace_members_1"."role" = ANY (ARRAY['owner'::"public"."workspace_role", 'admin'::"public"."workspace_role"]))))));



CREATE POLICY "Workspace owners can delete their workspaces" ON "public"."workspaces" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Workspace owners can manage members" ON "public"."workspace_members" USING ((EXISTS ( SELECT 1
   FROM "public"."workspaces"
  WHERE (("workspaces"."id" = "workspace_members"."workspace_id") AND ("workspaces"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Workspace owners can update their workspaces" ON "public"."workspaces" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_training_examples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_tags_user_access" ON "public"."lead_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_tags"."lead_id") AND ("leads"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."lead_variables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_user_access" ON "public"."tags" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."voice_previews" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."agents";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_workspace_owner_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_workspace_owner_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_workspace_owner_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_lead_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_lead_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_lead_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_lead_pipeline_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_lead_pipeline_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_lead_pipeline_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_lead_tag_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_lead_tag_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_lead_tag_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_lead"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_variable"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_variable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_variable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_variable_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_variable_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_variable_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_member"("workspace_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("workspace_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("workspace_id" "uuid", "user_id" "uuid") TO "service_role";



























GRANT ALL ON TABLE "public"."agent_knowledge" TO "anon";
GRANT ALL ON TABLE "public"."agent_knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_knowledge" TO "service_role";



GRANT ALL ON TABLE "public"."agent_training_examples" TO "anon";
GRANT ALL ON TABLE "public"."agent_training_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_training_examples" TO "service_role";



GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_documents" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_documents" TO "service_role";



GRANT ALL ON TABLE "public"."lead_activities" TO "anon";
GRANT ALL ON TABLE "public"."lead_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_activities" TO "service_role";



GRANT ALL ON TABLE "public"."lead_notes" TO "anon";
GRANT ALL ON TABLE "public"."lead_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_notes" TO "service_role";



GRANT ALL ON TABLE "public"."lead_tags" TO "anon";
GRANT ALL ON TABLE "public"."lead_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_tags" TO "service_role";



GRANT ALL ON TABLE "public"."lead_variables" TO "anon";
GRANT ALL ON TABLE "public"."lead_variables" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_variables" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."pipelines" TO "anon";
GRANT ALL ON TABLE "public"."pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."voice_previews" TO "anon";
GRANT ALL ON TABLE "public"."voice_previews" TO "authenticated";
GRANT ALL ON TABLE "public"."voice_previews" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
