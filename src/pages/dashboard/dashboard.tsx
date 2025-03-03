
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChevronUp, Target, Users, MessageSquare, ArrowUpRight } from "lucide-react";

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

const conversionData = [
  { name: "Converted", value: 68 },
  { name: "Pending", value: 22 },
  { name: "Lost", value: 10 },
];

const COLORS = ["#0088FE", "#FFBB28", "#FF8042"];

export default function DashboardPage() {
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
        {/* Area Chart - Simplified */}
        <Card className="col-span-2 bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-slate-900 text-base font-medium">Lead Acquisition</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Monthly trends
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={leadData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f1f5f9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f1f5f9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#f1f5f9' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontSize: 12, fontWeight: 500, color: '#333' }}
                  itemStyle={{ fontSize: 12, color: '#666', padding: '2px 0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#0f172a" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Pie Chart - Simplified */}
        <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-slate-900 text-base font-medium">Conversion Status</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Current metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  stroke="none"
                >
                  {conversionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ display: 'none' }}
                  itemStyle={{ fontSize: 12, color: '#666', padding: '2px 0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 text-center -mt-2">
              {conversionData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs font-medium text-slate-700">{entry.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bar Chart - Weekly Activity */}
      <Card className="bg-white shadow-none border border-slate-100 overflow-hidden rounded-xl">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-slate-900 text-base font-medium">Weekly Activity</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#f1f5f9' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
                }}
                labelStyle={{ fontSize: 12, fontWeight: 500, color: '#333' }}
                itemStyle={{ fontSize: 12, color: '#666', padding: '2px 0' }}
              />
              <Bar 
                dataKey="value" 
                fill="#f1f5f9"
                radius={[4, 4, 0, 0]}
                barSize={30}
              >
                {activityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={index === 4 ? "#0f172a" : "#f1f5f9"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
