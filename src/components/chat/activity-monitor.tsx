
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
  Edit,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity as ActivityType } from "./types/activity-types";

interface ActivityMonitorProps {
  lead: Lead;
  activities?: ActivityType[];
}

export function ActivityMonitor({ lead, activities = [] }: ActivityMonitorProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-primary" />
          Activity Monitor
        </h2>
        <Badge variant="outline" className="font-mono text-xs py-0 px-1.5">
          {activities.length} events
        </Badge>
      </div>

      <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
        <div className="border-b px-3 py-1">
          <TabsList className="w-full h-8">
            <TabsTrigger value="timeline" className="text-xs">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs">
              <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">
              <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
              Insights
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-3">
              <ActivityTab activities={activities} leadName={lead.name} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3 p-3">
              <Card className="shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-xs font-medium">
                    Last Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-xs">
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground mt-1">
                    {format(new Date(lead.created_at), "PPpp")}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-xs font-medium">
                    Message Count
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 px-3 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs">Email</span>
                    </div>
                    <span className="text-xs font-medium">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs">SMS</span>
                    </div>
                    <span className="text-xs font-medium">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-xs">Notes</span>
                    </div>
                    <span className="text-xs font-medium">0</span>
                  </div>

                  <div className="border-t pt-1.5 mt-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium">Total</span>
                    <span className="text-xs font-medium">0</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-xs font-medium">
                    Communication Mix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-3 py-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs">Email</span>
                      </div>
                      <span className="text-[0.65rem]">0%</span>
                    </div>
                    <Progress value={0} className="h-1.5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs">SMS</span>
                      </div>
                      <span className="text-[0.65rem]">0%</span>
                    </div>
                    <Progress value={0} className="h-1.5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs">Notes</span>
                      </div>
                      <span className="text-[0.65rem]">0%</span>
                    </div>
                    <Progress value={0} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-xs font-medium">
                    Lead Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-1">
                  <div className="px-3 py-2 bg-muted rounded-md flex items-center justify-between">
                    <Badge
                      variant={lead.status ? "outline" : "secondary"}
                      className="px-1.5 py-0.5 text-xs"
                    >
                      {lead.status || "New"}
                    </Badge>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Edit className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="suggestions" className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3 p-3">
              <Card className="shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-xs font-medium">
                    Engagement Level
                  </CardTitle>
                  <CardDescription className="text-[0.65rem]">
                    Based on communication and activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 py-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-8 rounded-full flex items-center justify-center border border-yellow-500 text-yellow-500 bg-yellow-500/10"
                    >
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-yellow-500">
                        Low Engagement
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground">
                        Needs immediate attention
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-xs font-medium">
                    Activity Suggestions
                  </CardTitle>
                  <CardDescription className="text-[0.65rem]">
                    Based on communication patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-3 py-1">
                  <div className="px-2 py-1.5 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-md">
                    <p className="font-medium text-yellow-800 dark:text-yellow-300 text-xs">
                      Follow up needed
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 text-[0.65rem] mt-0.5">
                      No communication in over a week.
                    </p>
                  </div>
                  <div className="px-2 py-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-md">
                    <p className="font-medium text-blue-800 dark:text-blue-300 text-xs">
                      Try different channel
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 text-[0.65rem] mt-0.5">
                      Email responses are low. Try SMS.
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
