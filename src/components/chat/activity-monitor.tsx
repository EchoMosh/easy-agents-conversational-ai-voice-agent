
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
      <div className="p-2 border-b flex items-center justify-between">
        <h2 className="text-xs font-semibold flex items-center gap-1">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Activity Monitor
        </h2>
        <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">
          {activities.length} events
        </Badge>
      </div>

      <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
        <div className="border-b px-2 py-1">
          <TabsList className="w-full h-7">
            <TabsTrigger value="timeline" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs">
              <BarChart2 className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">
              <ThumbsUp className="h-3 w-3 mr-1" />
              Insights
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-2">
              <ActivityTab activities={activities} leadName={lead.name} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2 p-2">
              <Card className="shadow-none border-0">
                <CardHeader className="px-2 py-1.5">
                  <CardTitle className="text-xs font-medium">
                    Last Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(lead.created_at), "PPpp")}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-0">
                <CardHeader className="px-2 py-1.5">
                  <CardTitle className="text-xs font-medium">
                    Message Count
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 px-2 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-blue-500" />
                      <span className="text-[10px]">Email</span>
                    </div>
                    <span className="text-[10px] font-medium">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-green-500" />
                      <span className="text-[10px]">SMS</span>
                    </div>
                    <span className="text-[10px] font-medium">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-purple-500" />
                      <span className="text-[10px]">Notes</span>
                    </div>
                    <span className="text-[10px] font-medium">0</span>
                  </div>

                  <div className="border-t pt-1 mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-medium">Total</span>
                    <span className="text-[10px] font-medium">0</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-0">
                <CardHeader className="px-2 py-1.5">
                  <CardTitle className="text-xs font-medium">
                    Communication Mix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-2 py-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-500" />
                        <span className="text-[10px]">Email</span>
                      </div>
                      <span className="text-[10px]">0%</span>
                    </div>
                    <Progress value={0} className="h-1" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-green-500" />
                        <span className="text-[10px]">SMS</span>
                      </div>
                      <span className="text-[10px]">0%</span>
                    </div>
                    <Progress value={0} className="h-1" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-purple-500" />
                        <span className="text-[10px]">Notes</span>
                      </div>
                      <span className="text-[10px]">0%</span>
                    </div>
                    <Progress value={0} className="h-1" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-0">
                <CardHeader className="px-2 py-1.5">
                  <CardTitle className="text-xs font-medium">
                    Lead Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 py-1">
                  <div className="px-2 py-1.5 bg-muted rounded-md flex items-center justify-between">
                    <Badge
                      variant={lead.status ? "outline" : "secondary"}
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {lead.status || "New"}
                    </Badge>
                    <Button variant="outline" size="sm" className="h-6 text-[10px]">
                      <Edit className="h-2.5 w-2.5 mr-1" />
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
            <div className="space-y-2 p-2">
              <Card className="shadow-none border-0">
                <CardHeader className="px-2 py-1.5">
                  <CardTitle className="text-xs font-medium">
                    Engagement Level
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Based on communication and activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="size-6 rounded-full flex items-center justify-center border border-yellow-500 text-yellow-500 bg-yellow-500/10"
                    >
                      <AlertCircle className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-yellow-500">
                        Low Engagement
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Needs immediate attention
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-0">
                <CardHeader className="px-2 py-1.5">
                  <CardTitle className="text-xs font-medium">
                    Activity Suggestions
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Based on communication patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 px-2 py-1">
                  <div className="px-2 py-1 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-md">
                    <p className="font-medium text-yellow-800 dark:text-yellow-300 text-[10px]">
                      Follow up needed
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 text-[10px] mt-0.5">
                      No communication in over a week.
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-md">
                    <p className="font-medium text-blue-800 dark:text-blue-300 text-[10px]">
                      Try different channel
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 text-[10px] mt-0.5">
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
