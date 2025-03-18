import { Lead } from "@/pages/dashboard/leads";
import { Activity, BarChart2, Layers, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityTab } from "../chat/tabs/activity-tab";
import {
  Mail,
  MessageSquare,
  Phone,
  Clock,
  AlertCircle,
  FileText,
  Info,
  Edit,
  ThumbsUp as ThumbsUpIcon,
  Tags,
  DollarSign,
  UserCheck,
  LinkIcon,
  Star,
  UserPlus,
  PenTool,
  Eye
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, formatDistanceToNow, parseISO, isSameDay } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ActivityMonitorProps {
  lead: Lead;
  activities?: Array<{
    id: string;
    type: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

export function ActivityMonitor({ lead, activities = [] }: ActivityMonitorProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Monitor
        </h2>
        <Badge variant="outline" className="font-mono">
          {activities.length} events
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
              <ActivityTab activities={activities} leadName={lead.name} />
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
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(lead.created_at), "PPpp")}
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
                    <span className="font-medium">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span>SMS</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <span>Notes</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>

                  <div className="border-t pt-2 mt-2 flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">0</span>
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
                      <span className="text-xs">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span>SMS</span>
                      </div>
                      <span className="text-xs">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        <span>Notes</span>
                      </div>
                      <span className="text-xs">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
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
                      className={`size-12 rounded-full flex items-center justify-center border-2 border-yellow-500 text-yellow-500 bg-yellow-500/10`}
                    >
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <div className={`text-lg font-bold text-yellow-500`}>
                        Low Engagement
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Needs immediate attention
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
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
