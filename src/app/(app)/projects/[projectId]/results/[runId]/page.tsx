"use client"

import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useRun, useResults, useAIInsights } from "@/lib/hooks"
import { formatDate, formatDuration, formatNumber } from "@/lib/utils"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import type { ResultMetrics } from "@/types"

const statusColor: Record<string, string> = {
  normal: "text-green-500",
  warning: "text-yellow-500",
  critical: "text-red-500",
}

export default function ResultsDetailPage({
  params,
}: {
  params: { projectId: string; runId: string }
}) {
  const { projectId, runId } = params
  const { data: run, isLoading: loadingRun } = useRun(projectId, runId)
  const { data: results, isLoading: loadingResults } = useResults(projectId, runId)
  const { data: insights } = useAIInsights(runId)

  if (loadingRun || loadingResults) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!run || !results) {
    return <div className="py-20 text-center text-muted-foreground">Results not found</div>
  }

  const metrics = Object.entries(results.metrics) as [keyof ResultMetrics, ResultMetrics[keyof ResultMetrics]][]

  const handleExport = () => {
    if (!run || !results) return
    const exportData = {
      run: { id: run.id, name: run.name, status: run.status, startedAt: run.startedAt, duration: run.duration },
      metrics: results.metrics,
      temperatureHistory: results.temperatureHistory,
      powerHistory: results.powerHistory,
      pressureHistory: results.pressureHistory,
      coolantFlowHistory: results.coolantFlowHistory,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${run.name.replace(/\s+/g, "_")}_results.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/${projectId}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Badge variant="success">{run.status}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{run.name}</h1>
          <p className="text-sm text-muted-foreground">
            Started {formatDate(run.startedAt)}
            {run.duration && ` · Duration: ${formatDuration(run.duration)}`}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map(([key, metric]) => (
          <Card key={key}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className={`text-lg font-bold font-mono ${statusColor[metric.status]}`}>
                {formatNumber(metric.value)}
              </p>
              <p className="text-[10px] text-muted-foreground">{metric.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Series Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="temperature">
            <TabsList>
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
              <TabsTrigger value="power">Power</TabsTrigger>
              <TabsTrigger value="pressure">Pressure</TabsTrigger>
              <TabsTrigger value="coolant">Coolant Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="temperature" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={results.temperatureHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Temperature (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="power" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={results.powerHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(142, 72%, 42%)" fill="hsl(142, 72%, 42%, 0.2)" name="Power (MWt)" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="pressure" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={results.pressureHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} name="Pressure (MPa)" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="coolant" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={results.coolantFlowHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(210, 72%, 50%)" fill="hsl(210, 72%, 50%, 0.2)" name="Flow Rate (kg/s)" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Summary */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{insights.summary}</p>
            <div className="mt-2 rounded-md border border-dashed p-2">
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ AI-generated output — verify all conclusions independently
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
