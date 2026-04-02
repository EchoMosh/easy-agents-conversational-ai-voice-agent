import { useState, useEffect } from "react";
import { ArrowLeft, Users, Loader2, CheckCircle, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneNumber } from "@/utils/phone-number-utils";
import { Agent } from "@/types/agent";
import { WorkspacePhone } from "./single-call-view";

interface TagRecord {
  id: string;
  name: string;
  color: string | null;
}

interface LeadRecord {
  id: string;
  name: string | null;
  phone: string;
}

interface BulkCallViewProps {
  agent: Agent;
  phoneNumbers: WorkspacePhone[];
  workspaceId: string;
  onBack: () => void;
}

type CampaignState = "setup" | "running" | "done";

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
];

const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  contacted:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  qualified:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  converted:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

async function fetchLeadIds(
  workspaceId: string,
  tagIds: string[],
  statuses: string[],
  dateRange: string,
): Promise<string[]> {
  // If tag filters applied, get lead IDs from lead_tags first
  let tagFilteredIds: string[] | null = null;
  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("lead_tags")
      .select("lead_id")
      .in("tag_id", tagIds);
    tagFilteredIds = [...new Set((tagRows || []).map((r) => r.lead_id))];
    if (tagFilteredIds.length === 0) return [];
  }

  let query = supabase
    .from("leads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .not("phone", "is", null);

  if (tagFilteredIds !== null) {
    query = query.in("id", tagFilteredIds);
  }
  if (statuses.length > 0) {
    query = query.in("status", statuses);
  }
  if (dateRange !== "all") {
    const days: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "6m": 180,
    };
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days[dateRange]);
    query = query.gte("created_at", cutoff.toISOString());
  }

  const { data } = await query;
  return (data || []).map((r) => r.id);
}

export function BulkCallView({
  agent,
  phoneNumbers,
  workspaceId,
  onBack,
}: BulkCallViewProps) {
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("all");
  const [leadCount, setLeadCount] = useState(0);
  const [isFetchingCount, setIsFetchingCount] = useState(false);

  const validPhones = phoneNumbers.filter((p) => p.vapi_phone_number_id);
  const [selectedPhoneId, setSelectedPhoneId] = useState(
    validPhones.length === 1 ? (validPhones[0].vapi_phone_number_id ?? "") : "",
  );

  const [campaignState, setCampaignState] = useState<CampaignState>("setup");
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, color")
        .eq("workspace_id", workspaceId)
        .order("name");
      if (!error && data) setTags(data);
    };
    fetchTags();
  }, [workspaceId]);

  // Update lead count when filters change
  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      setIsFetchingCount(true);
      try {
        const ids = await fetchLeadIds(
          workspaceId,
          selectedTagIds,
          selectedStatuses,
          dateRange,
        );
        if (!cancelled) setLeadCount(ids.length);
      } catch (err) {
        console.error("Error fetching lead count:", err);
      } finally {
        if (!cancelled) setIsFetchingCount(false);
      }
    };
    update();
    return () => {
      cancelled = true;
    };
  }, [selectedTagIds, selectedStatuses, dateRange, workspaceId]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const toggleStatus = (val: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val],
    );
  };

  const handleStartCampaign = async () => {
    if (!selectedPhoneId || leadCount === 0) return;

    const ids = await fetchLeadIds(
      workspaceId,
      selectedTagIds,
      selectedStatuses,
      dateRange,
    );
    if (ids.length === 0) return;

    // Fetch full lead data
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, name, phone")
      .in("id", ids);

    if (error || !leads || leads.length === 0) {
      console.error("Failed to fetch leads for campaign:", error);
      return;
    }

    setCampaignState("running");
    setProgress({ done: 0, total: leads.length, errors: 0 });

    let errors = 0;
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i] as LeadRecord;
      try {
        const { data, error: callError } = await supabase.functions.invoke(
          "initiate-vapi-call",
          {
            body: {
              v_agent_id: agent.v_agent_id,
              vapi_phone_number_id: selectedPhoneId,
              customer_number: lead.phone.startsWith("+")
                ? lead.phone
                : `+${lead.phone}`,
              customer_name: lead.name || undefined,
            },
          },
        );
        if (callError || !data?.success) {
          console.error(
            `Call failed for lead ${lead.id}:`,
            callError || data?.error,
          );
          errors++;
        }
      } catch (err) {
        console.error(`Call exception for lead ${lead.id}:`, err);
        errors++;
      }
      setProgress({ done: i + 1, total: leads.length, errors });
    }

    setCampaignState("done");
  };

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (campaignState === "done") {
    const succeeded = progress.total - progress.errors;
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold text-foreground">
          Campaign Complete
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{succeeded}</span>{" "}
          calls initiated
          {progress.errors > 0 && (
            <span className="text-destructive ml-1">
              · {progress.errors} failed
            </span>
          )}
        </p>
        <Button variant="outline" onClick={onBack} className="mt-2">
          Done
        </Button>
      </div>
    );
  }

  // ── Running screen ───────────────────────────────────────────────────────────
  if (campaignState === "running") {
    const percent =
      progress.total > 0
        ? Math.round((progress.done / progress.total) * 100)
        : 0;
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Calling {progress.done} of {progress.total}...
            </p>
            {progress.errors > 0 && (
              <p className="text-xs text-destructive">
                {progress.errors} failed
              </p>
            )}
          </div>
        </div>
        <Progress value={percent} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          Please keep this window open
        </p>
      </div>
    );
  }

  // ── Setup screen ─────────────────────────────────────────────────────────────
  return (
    <ScrollArea className="max-h-[420px]">
      <div className="flex flex-col gap-5 pr-1">
        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Tags
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No tags found in this workspace
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tag.name}
                    {selected && <X className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
          {selectedTagIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Leads matching <span className="font-medium">any</span> selected
              tag
            </p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Status
            <span className="text-muted-foreground font-normal ml-1.5">
              (optional)
            </span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_STATUSES.map((s) => {
              const selected = selectedStatuses.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selected
                      ? STATUS_STYLES[s.value]
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  } ${selected ? "ring-2 ring-inset ring-current/30" : ""}`}
                >
                  {s.label}
                  {selected && <X className="h-3 w-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date range */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Date Added</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lead count */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg">
          {isFetchingCount ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">
            {isFetchingCount ? (
              <span className="text-muted-foreground">Counting leads...</span>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {leadCount}
                </span>{" "}
                <span className="text-muted-foreground">
                  {leadCount === 1 ? "lead" : "leads"} match your filters
                </span>
              </>
            )}
          </span>
          {!isFetchingCount &&
            selectedTagIds.length === 0 &&
            selectedStatuses.length === 0 &&
            dateRange === "all" && (
              <Badge variant="secondary" className="ml-auto text-xs">
                All leads
              </Badge>
            )}
        </div>

        {/* Call From */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Call From <span className="text-destructive">*</span>
          </Label>
          {validPhones.length === 0 ? (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              No phone numbers configured. Add one in Phone Numbers settings.
            </p>
          ) : (
            <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a phone number..." />
              </SelectTrigger>
              <SelectContent>
                {validPhones.map((p) => (
                  <SelectItem key={p.id} value={p.vapi_phone_number_id!}>
                    {p.friendly_name ||
                      formatPhoneNumber(p.twilio_phone_number)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-1">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleStartCampaign}
            disabled={!selectedPhoneId || leadCount === 0 || isFetchingCount}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Start Campaign ({leadCount})
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
