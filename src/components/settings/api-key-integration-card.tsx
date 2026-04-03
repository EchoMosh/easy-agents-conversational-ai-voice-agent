import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plug, Unplug, Eye, EyeOff, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ApiKeyIntegrationCardProps {
  provider: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  placeholder?: string;
  helpText?: string;
  docsUrl?: string;
  isConnected: boolean;
  savedKey: string;
  onConnect: (apiKey: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function ApiKeyIntegrationCard({
  provider,
  name,
  description,
  icon: Icon,
  iconColor = "text-primary",
  placeholder = "Enter your API key",
  helpText,
  docsUrl,
  isConnected,
  savedKey,
  onConnect,
  onDisconnect,
}: ApiKeyIntegrationCardProps) {
  const [apiKey, setApiKey] = useState(savedKey);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await onConnect(apiKey.trim());
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect();
      setApiKey("");
      setShowKey(false);
    } finally {
      setDisconnecting(false);
    }
  };

  const maskedKey = savedKey
    ? `${savedKey.slice(0, 8)}${"•".repeat(20)}${savedKey.slice(-4)}`
    : "";

  return (
    <Card className="bg-card/50">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">{name}</h3>
                {docsUrl && (
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>

        {isConnected ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <Input value={maskedKey} disabled className="font-mono text-sm" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${provider}-key`} className="text-sm">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id={`${provider}-key`}
                  type={showKey ? "text" : "password"}
                  placeholder={placeholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {helpText && (
                <p className="text-xs text-muted-foreground">{helpText}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={saving || !apiKey.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
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
  );
}
