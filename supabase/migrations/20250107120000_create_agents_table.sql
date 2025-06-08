CREATE TYPE agent_role AS ENUM (
    'receptionist',
    'sales_agent',
    'customer_support',
    'technical_advisor',
    'appointment_scheduler',
    'product_specialist',
    'virtual_assistant'
);

CREATE TYPE background_sound_enum AS ENUM ('off', 'office', 'cafe', 'nature');
CREATE TYPE first_message_mode_enum AS ENUM ('assistant-speaks-first', 'user-speaks-first');
CREATE TYPE training_status_enum AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role agent_role,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    flow JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    objective TEXT,
    interaction_type TEXT[],
    language TEXT,
    voice_id TEXT,
    humor_level INTEGER,
    max_duration_seconds INTEGER,
    mermaid_chart TEXT,
    elevenlabs_agent_id TEXT,
    knowledge_ids TEXT[],
    v_agent_id TEXT,
    vapi_knowledge_base_id TEXT,
    vapi_file_ids TEXT[],
    voice_config JSONB,
    transcriber_config JSONB,
    model_config JSONB,
    call_timing JSONB,
    speaking_behavior JSONB,
    background_sound background_sound_enum,
    background_denoising_enabled BOOLEAN,
    first_message TEXT,
    first_message_mode first_message_mode_enum,
    end_call_message TEXT,
    end_call_phrases TEXT[],
    silence_timeout_message TEXT,
    training_status training_status_enum,
    last_trained_at TIMESTAMPTZ,
    training_webhook_url TEXT,
    training_examples JSONB
);
