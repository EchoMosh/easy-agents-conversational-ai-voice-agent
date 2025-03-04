
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { 
  ChevronUp, 
  Users, 
  ArrowUpRight, 
  BarChart2, 
  LineChart 
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart";

// Sample data for charts
const activityData = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 18 },
  { name: "Wed", value: 15 },
  { name: "Thu", value: 20 },
  { name: "Fri", value: 25 },
  { name: "Sat", value: 8 },
  { name: "Sun", value: 10 },
];

const leadData = [
  { name: "Jan", leads: 165 },
  { name: "Feb", leads: 180 },
  { name: "Mar", leads: 220 },
  { name: "Apr", leads: 250 },
  { name: "May", leads: 300 },
  { name: "Jun", leads: 290 },
];

// Data for funnel chart
const conversionData = [
  { name: "Leads", value: 100, fill: "hsl(var(--chart-1))" },
  { name: "Qualified", value: 80, fill: "hsl(var(--chart-2))" },
  { name: "Meetings", value: 50, fill: "hsl(var(--chart-3))" },
  { name: "Proposals", value: 30, fill: "hsl(var(--chart-4))" },
  { name: "Converted", value: 20, fill: "hsl(var(--chart-5))" },
];

// Data for pie chart
const conversionPieData = [
  { name: "Converted", value: 68, fill: "hsl(var(--chart-1))" },
  { name: "Pending", value: 22, fill: "hsl(var(--chart-2))" },
  { name: "Lost", value: 10, fill: "hsl(var(--chart-3))" },
];

// Chart configs
const leadChartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const activityChartConfig = {
  value: {
    label: "Activity",
    color: "hsl(var(--chart-2))",
  },
  highlight: {
    label: "Highlight",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const conversionChartConfig = {
  Leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  Qualified: {
    label: "Qualified",
    color: "hsl(var(--chart-2))",
  },
  Meetings: {
    label: "Meetings",
    color: "hsl(var(--chart-3))",
  },
  Proposals: {
    label: "Proposals",
    color: "hsl(var(--chart-4))",
  },
  Converted: {
    label: "Converted",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-medium text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">
          Overview of your performance metrics
        </p>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Simplified Metric Cards */}
        <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Total Leads</span>
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ChevronUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-medium text-slate-900">1,248</h3>
                <div className="flex items-center text-xs text-emerald-500">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  18.2%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Active Agents</span>
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ChevronUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-medium text-slate-900">12</h3>
                <div className="flex items-center text-xs text-emerald-500">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  +2 new
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Conversations</span>
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ChevronUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-medium text-slate-900">432</h3>
                <div className="flex items-center text-xs text-emerald-500">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  +57 today
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Conversion Rate</span>
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ChevronUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-medium text-slate-900">24.3%</h3>
                <div className="flex items-center text-xs text-emerald-500">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  5.2%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Lead Acquisition Chart - With Toggle - Using ShadCN Chart */}
        <Card className="col-span-2 bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 text-base font-medium">Lead Acquisition</CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Monthly trends
                </CardDescription>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-2 py-1 h-8 ${chartType === 'bar' ? 'bg-slate-100' : ''}`}
                  onClick={() => setChartType("bar")}
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-2 py-1 h-8 ${chartType === 'area' ? 'bg-slate-100' : ''}`}
                  onClick={() => setChartType("area")}
                >
                  <LineChart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <ChartContainer config={leadChartConfig} className="min-h-[280px] w-full">
              {chartType === 'area' ? (
                <AreaChart data={leadData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#f1f5f9' }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorLeads)" 
                  />
                </AreaChart>
              ) : (
                <BarChart data={leadData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#f1f5f9' }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="leads" 
                    fill="var(--color-leads)"
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                  />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Conversion Status as a Pie Chart using ShadCN Chart */}
        <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-slate-900 text-base font-medium">Conversion Status</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Sales funnel overview
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <ChartContainer config={conversionChartConfig} className="min-h-[250px] w-full">
              <PieChart>
                <Pie
                  data={conversionPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {conversionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Bar Chart - Weekly Activity using ShadCN Chart */}
      <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-slate-900 text-base font-medium">Weekly Activity</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <ChartContainer config={activityChartConfig} className="min-h-[240px] w-full">
            <BarChart data={activityData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f8fafc" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                tickLine={false} 
                axisLine={{ stroke: '#f1f5f9' }}
                tickMargin={10}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]} 
                barSize={30}
              >
                {activityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={index === 4 ? "var(--color-highlight)" : "var(--color-value)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
