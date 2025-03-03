
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowUpRight } from "lucide-react";

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

const COLORS = ["#000000", "#DDDDDD", "#F0F0F0"];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-medium text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">
          Overview of your performance metrics
        </p>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Simplified Metric Cards */}
        <MetricCard 
          title="Total Leads" 
          value="1,248" 
          change="+18.2%" 
          positive={true} 
        />
        
        <MetricCard 
          title="Active Agents" 
          value="12" 
          change="+2 new" 
          positive={true} 
        />
        
        <MetricCard 
          title="Conversations" 
          value="432" 
          change="+57 today" 
          positive={true} 
        />
        
        <MetricCard 
          title="Conversion Rate" 
          value="24.3%" 
          change="+5.2%" 
          positive={true} 
        />
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Area Chart */}
        <Card className="col-span-2 border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-900">Lead Acquisition</h3>
              <p className="text-sm text-slate-500">Monthly trends</p>
            </div>
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
                  stroke="#000000" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Pie Chart */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-900">Conversion Status</h3>
              <p className="text-sm text-slate-500">Current metrics</p>
            </div>
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
      
      {/* Bar Chart */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-900">Weekly Activity</h3>
            <p className="text-sm text-slate-500">Last 7 days</p>
          </div>
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
                    fill={index === 4 ? "#000000" : "#f1f5f9"}
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

// Component for metric cards
function MetricCard({ title, value, change, positive }: { 
  title: string; 
  value: string; 
  change: string;
  positive: boolean;
}) {
  return (
    <Card className="border-none shadow-sm rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-2">{title}</span>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-medium text-slate-900">{value}</h3>
            <div className={`flex items-center text-xs ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              {change}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
