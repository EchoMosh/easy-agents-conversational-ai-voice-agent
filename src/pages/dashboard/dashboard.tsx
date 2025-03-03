
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { CalendarDays, MessageSquare, Target, Users } from "lucide-react";

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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h2>
        <p className="text-slate-500 mt-1">
          Overview of your sales and agent performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Leads</p>
                <h3 className="text-2xl font-semibold mt-1 text-slate-800">1,248</h3>
                <p className="text-xs text-emerald-600 mt-1 flex items-center">
                  <span className="i-lucide-trending-up mr-1"></span>
                  +18.2% from last month
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Agents</p>
                <h3 className="text-2xl font-semibold mt-1 text-slate-800">12</h3>
                <p className="text-xs text-emerald-600 mt-1 flex items-center">
                  <span className="i-lucide-trending-up mr-1"></span>
                  +2 new this week
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Conversations</p>
                <h3 className="text-2xl font-semibold mt-1 text-slate-800">432</h3>
                <p className="text-xs text-emerald-600 mt-1 flex items-center">
                  <span className="i-lucide-trending-up mr-1"></span>
                  +57 today
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
                <h3 className="text-2xl font-semibold mt-1 text-slate-800">24.3%</h3>
                <p className="text-xs text-emerald-600 mt-1 flex items-center">
                  <span className="i-lucide-trending-up mr-1"></span>
                  +5.2% from last week
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 bg-white border-0 shadow-sm overflow-hidden">
          <CardHeader className="pt-6 px-6 pb-0 border-b border-slate-100">
            <CardTitle className="text-slate-800 text-lg">Lead Acquisition</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Monthly lead generation trends
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={leadData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 bg-white border-0 shadow-sm overflow-hidden">
          <CardHeader className="pt-6 px-6 pb-0 border-b border-slate-100">
            <CardTitle className="text-slate-800 text-lg">Lead Status</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Current conversion metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {conversionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 mt-2 text-center">
              {conversionData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full" 
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
      
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <CardHeader className="pt-6 px-6 pb-0 border-b border-slate-100">
          <CardTitle className="text-slate-800 text-lg">Weekly Activity</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Agent interactions over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
