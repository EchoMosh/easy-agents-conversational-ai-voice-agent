import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, Cpu, Zap, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ApiKeyIntegrationCard } from "./api-key-integration-card";
import { TwilioIntegrationSettings } from "./twilio-integration-settings";

interface Integration {
  provider: string;
  api_key: string | null;
  is_connected: boolean;
}

const PROVIDERS = [
  {
    provider: "elevenlabs",
    name: "ElevenLabs",
    description: "Premium AI voices with natural speech and emotion",
    icon: Zap,
    iconColor: "text-amber-500",
    placeholder: "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    helpText: "Get your API key from elevenlabs.io/app/settings/api-keys",
    docsUrl: "https://elevenlabs.io",
  },
  {
    provider: "openai",
    name: "OpenAI",
    description: "GPT models for advanced conversation intelligence",
    icon: Brain,
    iconColor: "text-emerald-500",
    placeholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    helpText: "Create an API key at platform.openai.com/api-keys",
    docsUrl: "https://platform.openai.com",
  },
  {
    provider: "groq",
    name: "Groq",
    description: "Ultra-fast LLM inference for real-time voice conversations",
    icon: Cpu,
    iconColor: "text-orange-500",
    placeholder: "gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    helpText: "Get your API key from console.groq.com/keys",
    docsUrl: "https://console.groq.com",
  },
] as const;

export function IntegrationsSettings() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("workspace_integrations")
        .select("provider, api_key, is_connected")
        .eq("workspace_id", currentWorkspace.id);

      if (error) {
        console.error("Failed to fetch integrations:", error);
        return;
      }

      setIntegrations((data as Integration[]) || []);
    } catch (err) {
      console.error("Error loading integrations:", err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleConnect = async (provider: string, apiKey: string) => {
    if (!currentWorkspace?.id) return;

    try {
      const { error } = await supabase.from("workspace_integrations").upsert(
        {
          workspace_id: currentWorkspace.id,
          provider,
          api_key: apiKey,
          is_connected: true,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "workspace_id,provider" },
      );

      if (error) {
        console.error(`Failed to save ${provider} integration:`, error);
        throw error;
      }

      setIntegrations((prev) => {
        const existing = prev.find((i) => i.provider === provider);
        if (existing) {
          return prev.map((i) =>
            i.provider === provider
              ? { ...i, api_key: apiKey, is_connected: true }
              : i,
          );
        }
        return [...prev, { provider, api_key: apiKey, is_connected: true }];
      });

      toast({
        title: "Connected",
        description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved successfully.`,
      });
    } catch (err) {
      console.error(`Error connecting ${provider}:`, err);
      toast({
        title: "Error",
        description: `Failed to save API key. Please try again.`,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!currentWorkspace?.id) return;

    try {
      const { error } = await supabase
        .from("workspace_integrations")
        .delete()
        .eq("workspace_id", currentWorkspace.id)
        .eq("provider", provider);

      if (error) {
        console.error(`Failed to disconnect ${provider}:`, error);
        throw error;
      }

      setIntegrations((prev) => prev.filter((i) => i.provider !== provider));

      toast({
        title: "Disconnected",
        description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} has been disconnected.`,
      });
    } catch (err) {
      console.error(`Error disconnecting ${provider}:`, err);
      toast({
        title: "Error",
        description: `Failed to disconnect. Please try again.`,
        variant: "destructive",
      });
      throw err;
    }
  };

  if (!currentWorkspace) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Integrations</h2>
        <Card className="bg-card/50">
          <CardContent className="pt-6 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your API keys to enable voice, AI, and telephony features
        </p>
      </div>

      <div className="grid gap-3">
        {PROVIDERS.map((p) => {
          const integration = integrations.find(
            (i) => i.provider === p.provider,
          );
          return (
            <ApiKeyIntegrationCard
              key={p.provider}
              provider={p.provider}
              name={p.name}
              description={p.description}
              icon={p.icon}
              iconColor={p.iconColor}
              placeholder={p.placeholder}
              helpText={p.helpText}
              docsUrl={p.docsUrl}
              isConnected={integration?.is_connected ?? false}
              savedKey={integration?.api_key ?? ""}
              onConnect={(key) => handleConnect(p.provider, key)}
              onDisconnect={() => handleDisconnect(p.provider)}
            />
          );
        })}
      </div>

      <div className="pt-2">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Telephony
        </h3>
        <TwilioIntegrationSettings />
      </div>
    </div>
  );
}
