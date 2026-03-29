"use client"

import * as React from "react"
import {
  Users,
  Activity,
  FolderKanban,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "recharts"

const stats = [
  { label: "Total Users", value: "4", icon: Users, color: "text-blue-500", change: "+2 this month" },
  { label: "Active Projects", value: "5", icon: FolderKanban, color: "text-green-500", change: "+1 this week" },
  { label: "Simulations Today", value: "12", icon: Zap, color: "text-yellow-500", change: "+3 vs yesterday" },
  { label: "System Uptime", value: "99.97%", icon: Activity, color: "text-primary", change: "Last 30 days" },
]

const simulationTrend = [
  { day: "Mon", simulations: 8, completed: 7 },
  { day: "Tue", simulations: 15, completed: 14 },
  { day: "Wed", simulations: 12, completed: 11 },
  { day: "Thu", simulations: 18, completed: 16 },
  { day: "Fri", simulations: 22, completed: 20 },
  { day: "Sat", simulations: 6, completed: 6 },
  { day: "Sun", simulations: 4, completed: 4 },
]

const resourceUsage = [
  { time: "00:00", cpu: 25, memory: 40 },
  { time: "04:00", cpu: 18, memory: 38 },
  { time: "08:00", cpu: 45, memory: 55 },
  { time: "12:00", cpu: 72, memory: 68 },
  { time: "16:00", cpu: 88, memory: 78 },
  { time: "20:00", cpu: 55, memory: 60 },
  { time: "Now", cpu: 62, memory: 65 },
]

const recentActivity = [
  { id: 1, user: "Dr. Elena Vasquez", action: "Started simulation", project: "PWR Baseline Study", time: "5 min ago", status: "running" as const },
  { id: 2, user: "Dr. James Chen", action: "Created project", project: "BWR Thermal Analysis", time: "1 hour ago", status: "completed" as const },
  { id: 3, user: "Dr. Elena Vasquez", action: "Exported results", project: "PWR Baseline Study", time: "2 hours ago", status: "completed" as const },
  { id: 4, user: "Operations Manager", action: "Updated system settings", project: "—", time: "3 hours ago", status: "completed" as const },
  { id: 5, user: "Dr. James Chen", action: "Viewed knowledge doc", project: "PWR Design Fundamentals", time: "5 hours ago", status: "completed" as const },
]

const systemAlerts = [
  { id: 1, severity: "warning" as const, message: "High memory usage on simulation node 3 (87%)", time: "10 min ago" },
  { id: 2, severity: "info" as const, message: "Scheduled maintenance window: March 10, 2026 02:00-04:00 UTC", time: "1 day ago" },
  { id: 3, severity: "success" as const, message: "Database backup completed successfully", time: "6 hours ago" },
]

const severityConfig = {
  warning: { icon: AlertTriangle, variant: "warning" as const },
  info: { icon: Clock, variant: "info" as const },
  success: { icon: CheckCircle2, variant: "success" as const },
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and system monitoring</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Simulation Activity (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={simulationTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="simulations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resource Usage (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={resourceUsage}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} unit="%" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="hsl(47 96% 53%)" fill="hsl(47 96% 53% / 0.2)" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.user}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {item.action} · {item.project}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                    <Badge variant={item.status === "running" ? "info" : "secondary"} className="text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert) => {
                const config = severityConfig[alert.severity]
                const Icon = config.icon
                return (
                  <div key={alert.id} className="flex items-start gap-3 text-sm">
                    <Badge variant={config.variant} className="mt-0.5 shrink-0">
                      <Icon className="h-3 w-3" />
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
