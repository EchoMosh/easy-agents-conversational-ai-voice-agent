
import { Lead } from "@/pages/dashboard/leads";
import {
  Mail,
  MessageSquare,
  Phone,
  Clock,
  BarChart2,
  Activity,
  Layers,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Info,
  Edit,
  ThumbsUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import useChatStore from "@/hooks/use-chat-store";
import { format, formatDistanceToNow, parseISO, isSameDay } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ActivityMonitorProps {
  lead: Lead;
}

export function ActivityMonitor({ lead }: ActivityMonitorProps) {
  const { leadActivities } = useChatStore();
  const leadActivity = leadActivities[lead.id] || {
    leadId: lead.id,
    lastActive: new Date().toISOString(),
    messageCount: { email: 0, sms: 0, note: 0, total: 0 },
    responseTime: 0,
    activityHistory: [],
  };

  // Calculate message type percentages
  const totalMessages = leadActivity.messageCount.total || 1; // Avoid division by zero
  const emailPercentage =
    (leadActivity.messageCount.email / totalMessages) * 100;
  const smsPercentage = (leadActivity.messageCount.sms / totalMessages) * 100;
  const notePercentage = (leadActivity.messageCount.note / totalMessages) * 100;

  // Calculate engagement level (simple heuristic based on message count)
  const engagementLevel =
    totalMessages < 5 ? "Low" : totalMessages < 15 ? "Medium" : "High";

  // Corresponding colors for engagement levels
  const engagementColor =
    engagementLevel === "Low"
      ? "text-yellow-500"
      : engagementLevel === "Medium"
      ? "text-blue-500"
      : "text-green-500";

  // Group activity history by date
  const activityByDate = (leadActivity.activityHistory || []).reduce(
    (groups: Record<string, any[]>, activity: any) => {
      if (!activity?.created_at) return groups;

      const date = format(parseISO(activity.created_at), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    },
    {}
  );

  // Get activity type icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "note_added":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "email_sent":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "sms_sent":
        return <Phone className="h-4 w-4 text-green-500" />;
      case "status_updated":
        return <Edit className="h-4 w-4 text-amber-500" />;
      case "lead_created":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "task_completed":
        return <ThumbsUp className="h-4 w-4 text-teal-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Monitor
        </h2>
        <Badge variant="outline" className="font-mono">
          {leadActivity.activityHistory?.length || 0} events
        </Badge>
      </div>

      <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="w-full">
            <TabsTrigger value="timeline">
              <Layers className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="overview">
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <ThumbsUp className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4">
              {Object.keys(activityByDate).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(activityByDate).map(([date, activities]) => (
                    <div key={date} className="relative">
                      <div className="sticky top-0 bg-background py-2 z-10">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                          <h3 className="text-sm font-medium">
                            {isSameDay(parseISO(date), new Date())
                              ? "Today"
                              : format(parseISO(date), "EEEE, MMMM d, yyyy")}
                          </h3>
                          <Badge variant="outline" className="ml-auto">
                            {(activities as any[]).length}
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                      </div>

                      <div className="space-y-3 ml-1 relative">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-border"></div>

                        {(activities as any[]).map((activity, i) => (
                          <div key={i} className="relative flex gap-4 pl-7">
                            <div className="absolute left-0 size-6 rounded-full bg-background border-2 border-background flex items-center justify-center z-0">
                              {getActivityIcon(activity.activity_type || "")}
                            </div>

                            <div className="flex-1 bg-muted/40 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium">
                                  {activity.activity_type
                                    ? activity.activity_type
                                        .split("_")
                                        .map((word: string) =>
                                          word
                                            ? word.charAt(0).toUpperCase() +
                                              word.slice(1)
                                            : ""
                                        )
                                        .join(" ")
                                    : "Activity"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(
                                    parseISO(activity.created_at),
                                    "h:mm a"
                                  )}
                                </span>
                              </div>

                              <p className="text-sm">
                                {activity.description ||
                                  `Activity for ${lead.name}`}
                              </p>

                              {activity.metadata && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {Object.entries(activity.metadata).map(
                                    ([key, value]) => (
                                      <div key={key} className="flex gap-1">
                                        <span className="font-medium">
                                          {key}:
                                        </span>
                                        <span>{String(value)}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Activity className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                  <h3 className="font-medium mb-1">No activity recorded yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Activities will appear here as you interact with this lead
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4 p-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Last Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(leadActivity.lastActive), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(leadActivity.lastActive), "PPpp")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Message Count
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span>Email</span>
                    </div>
                    <span className="font-medium">
                      {leadActivity.messageCount.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span>SMS</span>
                    </div>
                    <span className="font-medium">
                      {leadActivity.messageCount.sms}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <span>Notes</span>
                    </div>
                    <span className="font-medium">
                      {leadActivity.messageCount.note}
                    </span>
                  </div>

                  <div className="border-t pt-2 mt-2 flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">
                      {leadActivity.messageCount.total}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Communication Mix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>Email</span>
                      </div>
                      <span className="text-xs">
                        {emailPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={emailPercentage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span>SMS</span>
                      </div>
                      <span className="text-xs">{smsPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={smsPercentage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        <span>Notes</span>
                      </div>
                      <span className="text-xs">
                        {notePercentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={notePercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Lead Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="px-4 py-3 bg-muted rounded-md flex items-center justify-between">
                    <Badge
                      variant={lead.status ? "outline" : "secondary"}
                      className="px-2 py-1"
                    >
                      {lead.status || "New"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4 p-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Engagement Level
                  </CardTitle>
                  <CardDescription>
                    Based on communication and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-12 rounded-full flex items-center justify-center border-2 ${
                        engagementLevel === "Low"
                          ? "border-yellow-500 text-yellow-500 bg-yellow-500/10"
                          : engagementLevel === "Medium"
                          ? "border-blue-500 text-blue-500 bg-blue-500/10"
                          : "border-green-500 text-green-500 bg-green-500/10"
                      }`}
                    >
                      {engagementLevel === "Low" ? (
                        <AlertCircle className="h-6 w-6" />
                      ) : engagementLevel === "Medium" ? (
                        <Clock className="h-6 w-6" />
                      ) : (
                        <ThumbsUp className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${engagementColor}`}>
                        {engagementLevel} Engagement
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {engagementLevel === "Low"
                          ? "Needs immediate attention"
                          : engagementLevel === "Medium"
                          ? "Making progress, keep going"
                          : "Excellent engagement, follow up with next steps"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Activity Suggestions
                  </CardTitle>
                  <CardDescription>
                    Based on communication patterns and recent activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {engagementLevel === "Low" && (
                    <>
                      <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-md text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-300">
                          Follow up needed
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                          No communication in over a week. Consider sending a
                          follow-up email.
                        </p>
                      </div>
                      <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-md text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-300">
                          Try different channel
                        </p>
                        <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                          Email responses are low. Consider trying SMS instead.
                        </p>
                      </div>
                    </>
                  )}

                  {engagementLevel === "Medium" && (
                    <>
                      <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-md text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-300">
                          Maintain momentum
                        </p>
                        <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                          Good engagement so far. Schedule a follow-up to maintain
                          momentum.
                        </p>
                      </div>
                      <div className="px-3 py-2 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900 rounded-md text-sm">
                        <p className="font-medium text-purple-800 dark:text-purple-300">
                          Add more context
                        </p>
                        <p className="text-purple-700 dark:text-purple-400 text-xs mt-1">
                          Consider adding more internal notes about this lead.
                        </p>
                      </div>
                    </>
                  )}

                  {engagementLevel === "High" && (
                    <>
                      <div className="px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-md text-sm">
                        <p className="font-medium text-green-800 dark:text-green-300">
                          Ready for next step
                        </p>
                        <p className="text-green-700 dark:text-green-400 text-xs mt-1">
                          High engagement suggests this lead is ready for a
                          proposal or demo.
                        </p>
                      </div>
                      <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-md text-sm">
                        <p className="font-medium text-emerald-800 dark:text-emerald-300">
                          Move pipeline stage
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-1">
                          Consider moving this lead to the next pipeline stage.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
