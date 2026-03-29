"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useResults } from "@/lib/hooks"
import { formatNumber } from "@/lib/utils"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ResultMetrics } from "@/types"
import { BarChart3 } from "lucide-react"

const metricStatusColor: Record<string, string> = {
  normal: "text-green-500",
  warning: "text-yellow-500",
  critical: "text-red-500",
}

interface Props {
  projectId: string
  runId: string | null
}

export function SimulationResultsPanel({ projectId, runId }: Props) {
  const { data: results, isLoading } = useResults(projectId, runId ?? "")

  if (!runId && !results) {
    return (
      <Card className="flex flex-col items-center justify-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Run a simulation to see results</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="flex flex-col overflow-hidden">
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="flex-1 space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!results) return null

  const metrics = Object.entries(results.metrics) as [keyof ResultMetrics, ResultMetrics[keyof ResultMetrics]][]

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="text-sm">Results Visualization</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {metrics.map(([key, metric]) => (
            <div key={key} className="rounded-md border p-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className={`text-sm font-bold font-mono ${metricStatusColor[metric.status]}`}>
                {formatNumber(metric.value)}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">{metric.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <Tabs defaultValue="temperature">
          <TabsList className="h-8">
            <TabsTrigger value="temperature" className="text-xs h-6">Temperature</TabsTrigger>
            <TabsTrigger value="power" className="text-xs h-6">Power</TabsTrigger>
            <TabsTrigger value="pressure" className="text-xs h-6">Pressure</TabsTrigger>
            <TabsTrigger value="coolant" className="text-xs h-6">Coolant</TabsTrigger>
          </TabsList>

          <TabsContent value="temperature" className="mt-3">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={results.temperatureHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} label={{ value: "Time (s)", position: "bottom", fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: "°C", angle: -90, position: "insideLeft", fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Temperature" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="power" className="mt-3">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={results.powerHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="value" stroke="hsl(142, 72%, 42%)" fill="hsl(142, 72%, 42%, 0.2)" name="Power (MWt)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="pressure" className="mt-3">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={results.pressureHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="value" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} name="Pressure (MPa)" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="coolant" className="mt-3">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={results.coolantFlowHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="value" stroke="hsl(210, 72%, 50%)" fill="hsl(210, 72%, 50%, 0.2)" name="Flow Rate (kg/s)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
