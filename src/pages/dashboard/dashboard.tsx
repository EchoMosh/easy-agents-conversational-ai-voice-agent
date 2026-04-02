import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Bot,
  MessageSquare,
  Target,
  BarChart3,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Data ---

const activityData = [
  { day: "Mon", conversations: 12 },
  { day: "Tue", conversations: 18 },
  { day: "Wed", conversations: 15 },
  { day: "Thu", conversations: 20 },
  { day: "Fri", conversations: 25 },
  { day: "Sat", conversations: 8 },
  { day: "Sun", conversations: 10 },
];

const leadData = [
  { month: "Jan", leads: 165 },
  { month: "Feb", leads: 180 },
  { month: "Mar", leads: 220 },
  { month: "Apr", leads: 250 },
  { month: "May", leads: 300 },
  { month: "Jun", leads: 290 },
];

const funnelStages = [
  { label: "Leads", value: 1248, percentage: 100 },
  { label: "Qualified", value: 998, percentage: 80 },
  { label: "Meetings", value: 624, percentage: 50 },
  { label: "Proposals", value: 374, percentage: 30 },
  { label: "Converted", value: 249, percentage: 20 },
];

// --- Chart Configs ---

const leadChartConfig = {
  leads: {
    label: "Leads",
    theme: {
      light: "hsl(var(--primary))",
      dark: "hsl(var(--primary))",
    },
  },
} satisfies ChartConfig;

const activityChartConfig = {
  conversations: {
    label: "Conversations",
    theme: {
      light: "hsl(var(--primary))",
      dark: "hsl(var(--primary))",
    },
  },
} satisfies ChartConfig;

// --- Metric card data ---

interface MetricCardData {
  title: string;
  value: string;
  change: string;
  trending: "up" | "down";
  icon: React.ElementType;
}

const metrics: MetricCardData[] = [
  {
    title: "Total Leads",
    value: "1,248",
    change: "+18.2%",
    trending: "up",
    icon: Users,
  },
  {
    title: "Active Agents",
    value: "12",
    change: "+2 new",
    trending: "up",
    icon: Bot,
  },
  {
    title: "Conversations",
    value: "432",
    change: "+57 today",
    trending: "up",
    icon: MessageSquare,
  },
  {
    title: "Conversion Rate",
    value: "24.3%",
    change: "+5.2%",
    trending: "up",
    icon: Target,
  },
];

// --- Components ---

function MetricCard({ metric }: { metric: MetricCardData }) {
  const Icon = metric.icon;
  const TrendIcon = metric.trending === "up" ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {metric.title}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {metric.value}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <TrendIcon
            className={`h-3.5 w-3.5 ${
              metric.trending === "up" ? "text-emerald-500" : "text-destructive"
            }`}
          />
          <span
            className={`text-xs font-medium ${
              metric.trending === "up" ? "text-emerald-500" : "text-destructive"
            }`}
          >
            {metric.change}
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelStage({
  stage,
  index,
}: {
  stage: (typeof funnelStages)[number];
  index: number;
}) {
  // Progressively reduce opacity for each stage to create visual depth
  const opacityClass = [
    "bg-primary",
    "bg-primary/80",
    "bg-primary/60",
    "bg-primary/40",
    "bg-primary/25",
  ][index];

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-muted-foreground text-right">
        {stage.label}
      </span>
      <div className="flex-1 h-7 rounded bg-muted overflow-hidden">
        <div
          className={`h-full rounded transition-all ${opacityClass}`}
          style={{ width: `${stage.percentage}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-xs font-medium tabular-nums text-foreground text-right">
        {stage.value.toLocaleString()}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [chartView, setChartView] = useState<"bar" | "area">("area");

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        {/* Lead Acquisition - spans 3 of 5 columns */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-medium">
                Lead Acquisition
              </CardTitle>
              <CardDescription>Monthly lead volume</CardDescription>
            </div>
            <Tabs
              value={chartView}
              onValueChange={(v) => setChartView(v as "bar" | "area")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="area" className="h-6 px-2.5 text-xs">
                  <Activity className="mr-1.5 h-3 w-3" />
                  Area
                </TabsTrigger>
                <TabsTrigger value="bar" className="h-6 px-2.5 text-xs">
                  <BarChart3 className="mr-1.5 h-3 w-3" />
                  Bar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={leadChartConfig}
              className="h-[260px] w-full"
            >
              {chartView === "area" ? (
                <AreaChart
                  data={leadData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="leadGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#leadGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={leadData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="leads"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel - spans 2 of 5 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Funnel
            </CardTitle>
            <CardDescription>Lead to customer pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {funnelStages.map((stage, i) => (
                <FunnelStage key={stage.label} stage={stage} index={i} />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-emerald-500">20%</span>{" "}
                overall conversion rate
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
          <CardDescription>Conversations over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={activityChartConfig}
            className="h-[200px] w-full"
          >
            <BarChart
              data={activityData}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border/50"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="conversations"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                opacity={0.85}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
