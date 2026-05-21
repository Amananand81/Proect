"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  TrendingUp, 
  Package, 
  Truck, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import api from "@/lib/api";

const data = [
  { name: "Mon", revenue: 4000, shipments: 24 },
  { name: "Tue", revenue: 3000, shipments: 18 },
  { name: "Wed", revenue: 2000, shipments: 22 },
  { name: "Thu", revenue: 2780, shipments: 29 },
  { name: "Fri", revenue: 1890, shipments: 20 },
  { name: "Sat", revenue: 2390, shipments: 15 },
  { name: "Sun", revenue: 3490, shipments: 12 },
];

const stats = [
  { 
    label: "Total Shipments", 
    value: "1,284", 
    icon: Package, 
    trend: "+12.5%", 
    trendUp: true 
  },
  { 
    label: "Active Fleet", 
    value: "42/50", 
    icon: Truck, 
    trend: "+2", 
    trendUp: true 
  },
  { 
    label: "Revenue (MTD)", 
    value: "₹8.4L", 
    icon: TrendingUp, 
    trend: "+8.2%", 
    trendUp: true 
  },
  { 
    label: "Avg. Delivery Time", 
    value: "2.4 Days", 
    icon: Clock, 
    trend: "-4.1%", 
    trendUp: false 
  },
];

export default function DashboardPage() {
  const [statsData, setStatsData] = React.useState<any>(null);

  const fetchLock = React.useRef(false);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (fetchLock.current) return;
      try {
        fetchLock.current = true;
        const { data } = await api.get("/analytics/dashboard");
        if (data.success) {
          setStatsData(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setStatsData({ totalShipments: 1284, activeTrips: 42, totalRevenue: 840000, availableVehicles: 38 });
      } finally {
        fetchLock.current = false;
      }
    };
    fetchStats();
  }, []);

  const dynamicStats = [
    { 
      label: "Total Shipments", 
      value: statsData?.totalShipments || "...", 
      icon: Package, 
      trend: "+12.5%", 
      trendUp: true 
    },
    { 
      label: "Active Trips", 
      value: statsData?.activeTrips || "...", 
      icon: Truck, 
      trend: "+2", 
      trendUp: true 
    },
    { 
      label: "Total Revenue", 
      value: statsData?.totalRevenue ? `₹${(statsData.totalRevenue / 100000).toFixed(1)}L` : "...", 
      icon: TrendingUp, 
      trend: "+8.2%", 
      trendUp: true 
    },
    { 
      label: "Available Fleet", 
      value: statsData?.availableVehicles || "...", 
      icon: Clock, 
      trend: "-4.1%", 
      trendUp: false 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Executive Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {!statsData ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-32 animate-pulse bg-secondary/10 border-border/50" />
            ))
          ) : (
            dynamicStats.map((stat, i) => (
              <Card key={i} className="border-border/50 bg-secondary/20 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs flex items-center gap-1 mt-1">
                    {stat.trendUp ? (
                      <span className="text-accent flex items-center">
                        <ArrowUpRight className="h-3 w-3" /> {stat.trend}
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center">
                        <ArrowDownRight className="h-3 w-3" /> {stat.trend}
                      </span>
                    )}
                    <span className="text-muted-foreground">from last month</span>
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 border-border/50 bg-secondary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-border/50 bg-secondary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Daily Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="shipments" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
