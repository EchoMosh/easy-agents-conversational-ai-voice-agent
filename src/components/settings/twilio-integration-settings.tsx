import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Unplug, Plug, Eye, EyeOff } from "lucide-react";

export function TwilioIntegrationSettings() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const fetchIntegration = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("workspace_integrations")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .eq("provider", "twilio")
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch Twilio integration:", error);
        return;
      }

      if (data) {
        setAccountSid(data.account_sid ?? "");
        setAuthToken(data.auth_token ?? "");
        setIsConnected(data.is_connected ?? false);
      }
    } catch (err) {
      console.error("Error loading integration settings:", err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  const handleConnect = async () => {
    if (!currentWorkspace?.id) return;

    if (!accountSid.trim() || !authToken.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter both Account SID and Auth Token.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Verify credentials by calling Twilio API
      const verifyResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid.trim()}.json`,
        {
          headers: {
            Authorization:
              "Basic " + btoa(`${accountSid.trim()}:${authToken.trim()}`),
          },
        },
      );

      if (!verifyResponse.ok) {
        toast({
          title: "Invalid credentials",
          description:
            "Could not verify your Twilio credentials. Please check your Account SID and Auth Token.",
          variant: "destructive",
        });
        return;
      }

      // Upsert the integration record
      const { error } = await supabase.from("workspace_integrations").upsert(
        {
          workspace_id: currentWorkspace.id,
          provider: "twilio",
          account_sid: accountSid.trim(),
          auth_token: authToken.trim(),
          is_connected: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace_id,provider",
        },
      );

      if (error) {
        console.error("Failed to save Twilio integration:", error);
        throw error;
      }

      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Twilio account connected successfully.",
      });
    } catch (err) {
      console.error("Error connecting Twilio:", err);
      toast({
        title: "Error",
        description: "Failed to connect Twilio account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentWorkspace?.id) return;

    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from("workspace_integrations")
        .delete()
        .eq("workspace_id", currentWorkspace.id)
        .eq("provider", "twilio");

      if (error) {
        console.error("Failed to disconnect Twilio:", error);
        throw error;
      }

      setAccountSid("");
      setAuthToken("");
      setIsConnected(false);
      setShowToken(false);
      toast({
        title: "Disconnected",
        description: "Twilio account has been disconnected.",
      });
    } catch (err) {
      console.error("Error disconnecting Twilio:", err);
      toast({
        title: "Error",
        description: "Failed to disconnect Twilio account.",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (!currentWorkspace) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Integrations</h2>
        <Card>
          <CardContent className="pt-6 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Integrations</h2>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Twilio</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Twilio account to purchase phone numbers
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <Plug className="h-4 w-4 shrink-0" />
                <p className="text-sm">
                  Your Twilio account is connected. You can purchase phone
                  numbers from the Phone Numbers page.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input value={accountSid} disabled className="font-mono" />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Unplug className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twilio-sid">Account SID</Label>
                <Input
                  id="twilio-sid"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={accountSid}
                  onChange={(e) => setAccountSid(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio-token">Auth Token</Label>
                <div className="relative">
                  <Input
                    id="twilio-token"
                    type={showToken ? "text" : "password"}
                    placeholder="Your Twilio Auth Token"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="font-mono pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Find these in your Twilio Console under Account Info
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleConnect}
                  disabled={saving || !accountSid.trim() || !authToken.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Plug className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
