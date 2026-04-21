"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"
import type { CreateProjectPayload, SimulationParameters } from "@/types"

// ── Dashboard ──
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
  })
}

// ── Projects ──
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => api.createProject(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

// ── Runs ──
export function useRuns(projectId: string) {
  return useQuery({
    queryKey: ["runs", projectId],
    queryFn: () => api.listRuns(projectId),
    enabled: !!projectId,
  })
}

export function useRun(projectId: string, runId: string) {
  return useQuery({
    queryKey: ["run", projectId, runId],
    queryFn: () => api.getRun(projectId, runId),
    enabled: !!projectId && !!runId,
  })
}

export function useRunSimulation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: SimulationParameters) => api.runSimulation(projectId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runs", projectId] })
    },
  })
}

// ── Results ──
export function useResults(projectId: string, runId: string) {
  return useQuery({
    queryKey: ["results", projectId, runId],
    queryFn: () => api.getResults(projectId, runId),
    enabled: !!projectId && !!runId,
  })
}

// ── AI Insights ──
export function useAIInsights(runId: string) {
  return useQuery({
    queryKey: ["ai-insights", runId],
    queryFn: () => api.getAIInsights(runId),
    enabled: !!runId,
  })
}

// ── Logs ──
export function useLogs(runId: string) {
  return useQuery({
    queryKey: ["logs", runId],
    queryFn: () => api.getLogs(runId),
    enabled: !!runId,
    refetchInterval: 5000, // Simulate live polling
  })
}

// ── Knowledge ──
export function useKnowledgeDocs() {
  return useQuery({
    queryKey: ["knowledge-docs"],
    queryFn: api.listKnowledgeDocs,
  })
}

export function useKnowledgeDoc(docId: string) {
  return useQuery({
    queryKey: ["knowledge-doc", docId],
    queryFn: () => api.getKnowledgeDoc(docId),
    enabled: !!docId,
  })
}
