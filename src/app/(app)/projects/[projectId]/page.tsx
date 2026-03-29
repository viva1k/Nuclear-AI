"use client"

import Link from "next/link"
import { ArrowLeft, Play, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useProject, useRuns } from "@/lib/hooks"
import { formatDate, formatDuration, formatNumber } from "@/lib/utils"
import type { RunStatus } from "@/types"

const statusConfig: Record<RunStatus, { icon: React.ElementType; variant: "success" | "destructive" | "info" | "secondary" | "warning" }> = {
  completed: { icon: CheckCircle2, variant: "success" },
  failed: { icon: XCircle, variant: "destructive" },
  running: { icon: Play, variant: "info" },
  pending: { icon: Clock, variant: "secondary" },
  cancelled: { icon: XCircle, variant: "warning" },
}

export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string }
}) {
  const { projectId } = params
  const { data: project, isLoading: loadingProject } = useProject(projectId)
  const { data: runs, isLoading: loadingRuns } = useRuns(projectId)

  if (loadingProject || loadingRuns) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) return <div className="py-20 text-center text-muted-foreground">Project not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Badge variant="outline">{project.reactorType}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button asChild>
          <Link href={`/projects/${projectId}/simulation`}>
            <Play className="mr-2 h-4 w-4" /> New Simulation
          </Link>
        </Button>
      </div>

      {/* Project Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runs?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{formatDate(project.createdAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{formatDate(project.updatedAt)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulation Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {!runs?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No simulation runs yet. Start a new simulation above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Run</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Started</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Duration</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">Peak Temp</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {runs.map((run) => {
                    const sc = statusConfig[run.status]
                    const StatusIcon = sc.icon
                    return (
                      <tr key={run.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 font-medium">{run.name}</td>
                        <td className="py-3">
                          <Badge variant={sc.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" /> {run.status}
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
                        <td className="py-3">
                          {run.status === "completed" && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/projects/${projectId}/results/${run.id}`}>
                                Results <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
