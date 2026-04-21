"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProject } from "@/lib/hooks"
import { SimulationParameterPanel } from "@/features/simulation/parameter-panel"
import { SimulationResultsPanel } from "@/features/simulation/results-panel"
import { SimulationInsightsPanel } from "@/features/simulation/insights-panel"
import { Skeleton } from "@/components/ui/skeleton"

export default function SimulationPage({
  params,
}: {
  params: { projectId: string }
}) {
  const { projectId } = params
  const { data: project, isLoading } = useProject(projectId)
  const [activeRunId, setActiveRunId] = React.useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid h-[calc(100vh-12rem)] grid-cols-3 gap-4">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-lg font-bold">{project?.name} — Simulation Workspace</h1>
          <p className="text-xs text-muted-foreground">{project?.reactorType} reactor simulation</p>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="grid flex-1 grid-cols-[320px_1fr_340px] gap-4 overflow-hidden">
        {/* Left: Parameters */}
        <SimulationParameterPanel
          projectId={projectId}
          onRunStarted={(runId) => setActiveRunId(runId)}
        />

        {/* Center: Results */}
        <SimulationResultsPanel projectId={projectId} runId={activeRunId} />

        {/* Right: AI Insights + Logs */}
        <SimulationInsightsPanel runId={activeRunId} />
      </div>
    </div>
  )
}
