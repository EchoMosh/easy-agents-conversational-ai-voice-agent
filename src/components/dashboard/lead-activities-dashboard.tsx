import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  ActivityRecord,
  fetchAllLeadActivities,
  groupActivitiesByDate,
} from "@/utils/supabase-activity-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Edit,
  CheckCircle,
  AlertCircle,
  Info,
  BarChart2,
  ThumbsUp,
  Users,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function LeadActivitiesDashboard() {
  const { toast } = useToast();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Fetch all leads to display in the filter dropdown
  const {
    data: leads,
    isLoading: leadsLoading,
    error: leadsError,
  } = useQuery({
    queryKey: ["leads_basic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }

      return data || [];
    },
  });

  // Fetch all lead activities
  const {
    data: allActivities,
    isLoading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["all_lead_activities"],
    queryFn: async () => {
      return await fetchAllLeadActivities(20);
    },
  });

  // Filter activities if a lead is selected
  const filteredActivities = selectedLeadId
    ? { [selectedLeadId]: allActivities?.[selectedLeadId] || [] }
    : allActivities || {};

  // Count total activities
  const totalActivities = Object.values(filteredActivities).reduce(
    (count, activities) => count + activities.length,
    0
  );

  // Get most active lead
  const mostActiveLeadId = Object.entries(allActivities || {}).reduce(
    (maxLead, [leadId, activities]) => {
      if (!maxLead.leadId || activities.length > maxLead.count) {
        return { leadId, count: activities.length };
      }
      return maxLead;
    },
    { leadId: "", count: 0 }
  ).leadId;

  const mostActiveLead = leads?.find((lead) => lead.id === mostActiveLeadId);

  // Group activities by lead
  const activitiesByLead = Object.entries(filteredActivities).map(
    ([leadId, activities]) => {
      const lead = leads?.find((l) => l.id === leadId);
      return {
        lead,
        activities,
        recentActivity:
          activities.length > 0
            ? new Date(activities[0].created_at)
            : new Date(0),
      };
    }
  );

  // Sort leads by recent activity
  activitiesByLead.sort((a, b) => {
    return b.recentActivity.getTime() - a.recentActivity.getTime();
  });

  // Get activity type icon
  const getActivityIcon = (content: string) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("email") || lowerContent.includes("mail")) {
      return <Mail className="h-4 w-4 text-blue-500" />;
    } else if (
      lowerContent.includes("sms") ||
      lowerContent.includes("message") ||
      lowerContent.includes("texted")
    ) {
      return <Phone className="h-4 w-4 text-green-500" />;
    } else if (
      lowerContent.includes("note") ||
      lowerContent.includes("noted")
    ) {
      return <FileText className="h-4 w-4 text-purple-500" />;
    } else if (
      lowerContent.includes("status") ||
      lowerContent.includes("updated")
    ) {
      return <Edit className="h-4 w-4 text-amber-500" />;
    } else if (
      lowerContent.includes("created") ||
      lowerContent.includes("added")
    ) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleRefresh = () => {
    refetchActivities();
    toast({
      title: "Refreshed",
      description: "Lead activities have been refreshed",
    });
  };

  if (leadsError || activitiesError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-red-800 dark:text-red-300 font-medium">
              Error loading data
            </h3>
          </div>
          <p className="text-red-700 dark:text-red-400 text-sm mt-2">
            There was an error connecting to Supabase. Please try again later.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lead Activity Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={activitiesLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${
              activitiesLoading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lead Filter */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Filter by Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedLeadId === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedLeadId(null)}
                  >
                    <Users className="h-3 w-3 mr-1" /> All Leads
                  </Badge>
                  {leads?.slice(0, 5).map((lead) => (
                    <Badge
                      key={lead.id}
                      variant={
                        selectedLeadId === lead.id ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      {lead.name}
                    </Badge>
                  ))}
                </div>
                {leads && leads.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    + {leads.length - 5} more leads
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Activities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">{totalActivities}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  events recorded
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Active Lead */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Most Active Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading || leadsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : mostActiveLead ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 font-semibold">
                    {mostActiveLead.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{mostActiveLead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {mostActiveLead.email || "No email"}
                    </p>
                  </div>
                </div>
                <Badge>
                  {allActivities?.[mostActiveLeadId]?.length || 0} activities
                </Badge>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No activities recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="by-lead">
            <Users className="h-4 w-4 mr-2" />
            By Lead
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart2 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                All lead activities in chronological order
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activitiesLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : totalActivities === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="font-medium mb-1">No activity recorded yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Activities will appear here as you interact with your leads
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6 p-6">
                    {Object.entries(
                      // Flatten all activities and group by date
                      groupActivitiesByDate(
                        Object.values(filteredActivities).flat()
                      )
                    ).map(([date, activities]) => (
                      <div key={date} className="relative">
                        <div className="sticky top-0 bg-background py-2 z-10">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                            <h3 className="text-sm font-medium">
                              {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                            </h3>
                            <Badge variant="outline" className="ml-auto">
                              {activities.length}
                            </Badge>
                          </div>
                          <Separator className="my-2" />
                        </div>

                        <div className="space-y-3 ml-1 relative">
                          <div className="absolute left-3 top-0 bottom-0 w-px bg-border"></div>

                          {activities.map((activity, i) => {
                            const lead = leads?.find(
                              (l) => l.id === activity.lead_id
                            );
                            return (
                              <div
                                key={activity.id}
                                className="relative flex gap-4 pl-7"
                              >
                                <div className="absolute left-0 size-6 rounded-full bg-background border-2 border-background flex items-center justify-center z-10">
                                  {getActivityIcon(activity.content)}
                                </div>

                                <div className="flex-1 bg-muted/40 rounded-lg p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium flex items-center gap-2">
                                      {lead && (
                                        <Badge
                                          variant="outline"
                                          className="font-normal"
                                        >
                                          {lead.name}
                                        </Badge>
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        parseISO(activity.created_at),
                                        "h:mm a"
                                      )}
                                    </span>
                                  </div>

                                  <p className="text-sm">{activity.content}</p>

                                  {(activity.old_value ||
                                    activity.new_value) && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      {activity.old_value && (
                                        <div className="flex gap-1">
                                          <span className="font-medium">
                                            From:
                                          </span>
                                          <span>{activity.old_value}</span>
                                        </div>
                                      )}
                                      {activity.new_value && (
                                        <div className="flex gap-1">
                                          <span className="font-medium">
                                            To:
                                          </span>
                                          <span>{activity.new_value}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Lead Tab */}
        <TabsContent value="by-lead" className="space-y-4">
          {activitiesLoading || leadsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-[140px]" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activitiesByLead.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-medium mb-1">No lead activities found</h3>
              <p className="text-sm text-muted-foreground">
                Start interacting with your leads to track activities
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activitiesByLead.map(({ lead, activities }) => (
                <Card key={lead?.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 font-semibold">
                          {lead?.name[0].toUpperCase()}
                        </div>
                        {lead?.name}
                      </CardTitle>
                      <Badge>{activities.length} activities</Badge>
                    </div>
                    <CardDescription>
                      {lead?.email || "No email"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No recent activities
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activities.slice(0, 3).map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-2"
                          >
                            {getActivityIcon(activity.content)}
                            <div className="flex-1">
                              <p className="text-sm">{activity.content}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  parseISO(activity.created_at),
                                  "MMM d, yyyy 'at' h:mm a"
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                        {activities.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => setSelectedLeadId(lead?.id || null)}
                          >
                            View all {activities.length} activities
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Activity Analytics</CardTitle>
              <CardDescription>
                Visualize and analyze lead interaction patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <BarChart2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium mb-1">
                  Analytics Feature Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  This feature will provide detailed analytics on lead
                  interactions and engagement patterns.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
