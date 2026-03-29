"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useAIInsights, useLogs } from "@/lib/hooks"
import {
  Brain,
  AlertTriangle,
  Info,
  CheckCircle2,
  ScrollText,
  ShieldAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LogLevel } from "@/types"

const logColors: Record<LogLevel, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-gray-400",
  success: "text-green-400",
}

const severityConfig = {
  low: { color: "text-blue-500", bg: "bg-blue-500/10" },
  medium: { color: "text-yellow-500", bg: "bg-yellow-500/10" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10" },
  critical: { color: "text-red-500", bg: "bg-red-500/10" },
}

const predictionIcon = {
  positive: CheckCircle2,
  neutral: Info,
  warning: AlertTriangle,
}

interface Props {
  runId: string | null
}

export function SimulationInsightsPanel({ runId }: Props) {
  const { data: insights, isLoading: loadingInsights } = useAIInsights(runId ?? "")
  const { data: logs, isLoading: loadingLogs } = useLogs(runId ?? "")

  return (
    <Card className="flex flex-col overflow-hidden">
      <Tabs defaultValue="insights" className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="shrink-0 pb-0">
          <TabsList className="h-8 w-full">
            <TabsTrigger value="insights" className="flex-1 text-xs h-6 gap-1">
              <Brain className="h-3 w-3" /> AI Insights
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 text-xs h-6 gap-1">
              <ScrollText className="h-3 w-3" /> Live Logs
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden pt-3">
          {/* AI Insights Tab */}
          <TabsContent value="insights" className="h-full overflow-y-auto mt-0 space-y-4">
            {loadingInsights ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : insights ? (
              <>
                {/* Predictions */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Predictions
                  </h4>
                  <div className="space-y-2">
                    {insights.predictions.map((pred) => {
                      const Icon = predictionIcon[pred.type]
                      return (
                        <div
                          key={pred.id}
                          className="rounded-lg border p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Icon className={cn("h-3.5 w-3.5", {
                                "text-green-500": pred.type === "positive",
                                "text-blue-500": pred.type === "neutral",
                                "text-yellow-500": pred.type === "warning",
                              })} />
                              <span className="text-xs font-medium">{pred.label}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {Math.round(pred.confidence * 100)}% conf
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {pred.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <Separator />

                {/* Anomalies */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Anomalies Detected
                  </h4>
                  <div className="space-y-2">
                    {insights.anomalies.map((anom) => {
                      const sev = severityConfig[anom.severity]
                      return (
                        <div
                          key={anom.id}
                          className={cn("rounded-lg border p-3 space-y-1", sev.bg)}
                        >
                          <div className="flex items-center gap-1.5">
                            <ShieldAlert className={cn("h-3.5 w-3.5", sev.color)} />
                            <span className="text-xs font-medium">{anom.title}</span>
                            <Badge variant="outline" className="text-[10px] h-5 ml-auto">
                              {anom.severity}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {anom.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <Separator />

                {/* Summary */}
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Summary
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insights.summary}
                  </p>
                </section>

                {/* Disclaimer */}
                <div className="rounded-md border border-dashed p-2.5">
                  <p className="text-[10px] text-muted-foreground text-center">
                    ⚠️ AI-generated output — verify all conclusions independently
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Brain className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Run a simulation to see AI insights</p>
              </div>
            )}
          </TabsContent>

          {/* Live Logs Tab */}
          <TabsContent value="logs" className="h-full overflow-y-auto mt-0">
            {loadingLogs ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : logs ? (
              <div className="space-y-0.5 font-mono text-[11px]">
                {logs.map((log) => (
                  <div key={log.id} className="log-entry flex gap-2 py-0.5 hover:bg-muted/50 rounded px-1">
                    <span className="text-muted-foreground shrink-0 w-[60px]">
                      {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                    </span>
                    <span className={cn("shrink-0 w-[42px] uppercase font-bold", logColors[log.level])}>
                      {log.level}
                    </span>
                    {log.source && (
                      <span className="text-muted-foreground shrink-0">[{log.source}]</span>
                    )}
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <ScrollText className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No logs available</p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
