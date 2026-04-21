"use client"

import Link from "next/link"
import {
  Activity,
  FolderKanban,
  Zap,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Plus,
  BookOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/lib/hooks"
import { formatDate, formatDuration, formatNumber } from "@/lib/utils"
import type { RunStatus } from "@/types"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const performanceData = [
  { date: "Feb 28", efficiency: 32.8, safety: 88 },
  { date: "Mar 1", efficiency: 33.1, safety: 91 },
  { date: "Mar 2", efficiency: 31.9, safety: 85 },
  { date: "Mar 3", efficiency: 33.5, safety: 93 },
  { date: "Mar 4", efficiency: 32.4, safety: 87 },
  { date: "Mar 5", efficiency: 34.2, safety: 95 },
  { date: "Mar 6", efficiency: 33.1, safety: 92 },
]

const statusConfig: Record<RunStatus, { icon: React.ElementType; variant: "success" | "destructive" | "warning" | "info" | "secondary" }> = {
  completed: { icon: CheckCircle2, variant: "success" },
  failed: { icon: XCircle, variant: "destructive" },
  running: { icon: Play, variant: "info" },
  pending: { icon: Clock, variant: "secondary" },
  cancelled: { icon: XCircle, variant: "warning" },
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (!data) return null

  const stats = [
    { label: "Total Projects", value: data.totalProjects, icon: FolderKanban, color: "text-blue-500" },
    { label: "Active Simulations", value: data.activeSimulations, icon: Activity, color: "text-green-500" },
    { label: "Completed Runs", value: data.completedRuns, icon: Zap, color: "text-yellow-500" },
    { label: "Avg Efficiency", value: `${formatNumber(data.avgEfficiency * 100, 1)}%`, icon: TrendingUp, color: "text-primary" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your nuclear simulation workspace</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Performance Trend (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area type="monotone" dataKey="efficiency" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Efficiency %" />
                <Area type="monotone" dataKey="safety" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.15)" name="Safety Margin %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/projects">
                <Plus className="h-4 w-4" /> New Project
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/projects">
                <Play className="h-4 w-4" /> Run Simulation
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/knowledge">
                <BookOpen className="h-4 w-4" /> Browse Knowledge Base
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/settings">
                <Activity className="h-4 w-4" /> View Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Simulation Runs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Run</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Started</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Duration</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Peak Temp</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Safety</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recentRuns.map((run) => {
                  const sc = statusConfig[run.status]
                  const StatusIcon = sc.icon
                  return (
                    <tr key={run.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3">
                        <Link
                          href={`/projects/${run.projectId}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {run.name}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge variant={sc.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-3 hidden sm:table-cell text-muted-foreground">
                        {formatDate(run.startedAt)}
                      </td>
                      <td className="py-3 hidden md:table-cell text-muted-foreground">
                        {run.duration ? formatDuration(run.duration) : "—"}
                      </td>
                      <td className="py-3 hidden lg:table-cell font-mono">
                        {run.summary ? `${formatNumber(run.summary.peakTemperature, 1)}°C` : "—"}
                      </td>
                      <td className="py-3 hidden lg:table-cell font-mono">
                        {run.summary ? `${formatNumber(run.summary.safetyMargin * 100, 0)}%` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
