import type {
  Project,
  CreateProjectPayload,
  SimulationRun,
  SimulationResults,
  SimulationParameters,
  AIInsights,
  KnowledgeDoc,
  KnowledgeDocDetail,
  DashboardData,
  LogEntry,
} from "@/types"

type BackendPredictRequest = {
  temp: number
  pressure: number
  vibration: number
  radiation: number
  coolant_flow: number
}

type BackendPredictResponse = {
  analysis: string
  confidence_level: string
}

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

// ── Stateful stores (persist during session) ──
let projects: Project[] = []
let runs: SimulationRun[] = []

const runResultsById = new Map<string, SimulationResults>()
const runInsightsById = new Map<string, AIInsights>()
const runLogsById = new Map<string, LogEntry[]>()

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`API request failed (${response.status}): ${body || response.statusText}`)
  }

  return (await response.json()) as T
}

function toPredictPayload(params: SimulationParameters): BackendPredictRequest {
  return {
    temp: params.thermal.outletTemperature,
    pressure: params.coolant.pressure,
    vibration: Number((params.controlRods.insertionDepth / 100).toFixed(3)),
    radiation: Number((params.core.enrichmentLevel * 10).toFixed(3)),
    coolant_flow: params.coolant.flowRate,
  }
}

function parseConfidence(confidenceLevel: string): number {
  const parsed = Number.parseFloat(confidenceLevel.replace("%", ""))
  if (Number.isNaN(parsed)) return 0
  return Math.max(0, Math.min(parsed, 100))
}

function buildSeries(points: number, base: number, amplitude: number): { time: number; value: number }[] {
  const data: { time: number; value: number }[] = []
  for (let i = 0; i < points; i++) {
    const wave = Math.sin(i / 8) * amplitude
    data.push({ time: i, value: Number((base + wave).toFixed(2)) })
  }
  return data
}

function buildRunArtifacts(
  runId: string,
  params: SimulationParameters,
  prediction: BackendPredictResponse
): {
  summary: SimulationRun["summary"]
  results: SimulationResults
  insights: AIInsights
  logs: LogEntry[]
} {
  const confidence = parseConfidence(prediction.confidence_level)
  const isCritical = prediction.analysis.toLowerCase().includes("critical")

  const peakTemperature = params.thermal.outletTemperature + (isCritical ? 120 : 25)
  const avgPowerOutput = Math.min(params.safetyThresholds.maxPowerLevel, 2500 + confidence * 8)
  const safetyMargin = Number((Math.max(0, 1 - confidence / 140)).toFixed(3))
  const efficiencyRating = Number((Math.max(0.2, Math.min(0.45, 0.28 + confidence / 600))).toFixed(3))

  const summary = {
    peakTemperature,
    avgPowerOutput,
    safetyMargin,
    efficiencyRating,
  }

  const results: SimulationResults = {
    runId,
    temperatureHistory: buildSeries(120, params.thermal.inletTemperature, Math.max(5, (peakTemperature - params.thermal.inletTemperature) / 20)),
    powerHistory: buildSeries(120, avgPowerOutput, Math.max(20, avgPowerOutput * 0.02)),
    pressureHistory: buildSeries(120, params.coolant.pressure, 0.25),
    coolantFlowHistory: buildSeries(120, params.coolant.flowRate, Math.max(100, params.coolant.flowRate * 0.005)),
    metrics: {
      peakTemperature: {
        value: peakTemperature,
        unit: "°C",
        status: peakTemperature > params.safetyThresholds.maxTemperature ? "critical" : "normal",
      },
      avgPowerOutput: { value: avgPowerOutput, unit: "MWt", status: isCritical ? "warning" : "normal" },
      thermalEfficiency: { value: Number((efficiencyRating * 100).toFixed(2)), unit: "%", status: "normal" },
      coolantOutletTemp: {
        value: params.thermal.outletTemperature,
        unit: "°C",
        status: params.thermal.outletTemperature > params.safetyThresholds.maxTemperature ? "critical" : "normal",
      },
      reactivityCoefficient: { value: Number((-2 - confidence / 50).toFixed(2)), unit: "pcm/°C", status: "normal" },
      safetyMargin: {
        value: Number((safetyMargin * 100).toFixed(2)),
        unit: "%",
        status: safetyMargin < 0.25 ? "critical" : safetyMargin < 0.5 ? "warning" : "normal",
      },
    },
  }

  const insights: AIInsights = {
    runId,
    predictions: [
      {
        id: `${runId}-prediction-1`,
        label: prediction.analysis,
        description: `Backend model confidence reported at ${prediction.confidence_level}.`,
        confidence: confidence / 100,
        type: isCritical ? "warning" : "positive",
      },
    ],
    anomalies: isCritical
      ? [
          {
            id: `${runId}-anomaly-1`,
            title: "Elevated Risk Profile",
            severity: "high",
            description: "The backend model flagged this run as critical. Review coolant flow and thermal thresholds.",
            timestamp: new Date().toISOString(),
            parameter: "analysis",
          },
        ]
      : [],
    summary: `Prediction: ${prediction.analysis}. Confidence: ${prediction.confidence_level}.`,
  }

  const logs: LogEntry[] = [
    {
      id: `${runId}-log-1`,
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Submitting parameters to backend model",
      source: "api",
    },
    {
      id: `${runId}-log-2`,
      timestamp: new Date().toISOString(),
      level: isCritical ? "warn" : "success",
      message: `${prediction.analysis} (${prediction.confidence_level})`,
      source: "backend",
    },
  ]

  return { summary, results, insights, logs }
}

// ── Dashboard ──
export async function getDashboard(): Promise<DashboardData> {
  const completedRuns = runs.filter((r) => r.status === "completed")
  const avgEfficiency =
    completedRuns.length > 0
      ? completedRuns.reduce((acc, run) => acc + (run.summary?.efficiencyRating ?? 0), 0) / completedRuns.length
      : 0

  return {
    totalProjects: projects.length,
    activeSimulations: runs.filter((r) => r.status === "running").length,
    completedRuns: completedRuns.length,
    avgEfficiency,
    recentRuns: runs.slice(0, 5),
  }
}

// ── Projects ──
export async function listProjects(): Promise<Project[]> {
  return projects
}

export async function getProject(id: string): Promise<Project> {
  const project = projects.find((p) => p.id === id)
  if (!project) throw new Error(`Project ${id} not found`)
  return project
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const newProject: Project = {
    id: `proj-${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",
    runCount: 0,
  }
  projects = [newProject, ...projects]
  return newProject
}

// ── Runs ──
export async function listRuns(projectId: string): Promise<SimulationRun[]> {
  return runs.filter((r) => r.projectId === projectId)
}

export async function getRun(projectId: string, runId: string): Promise<SimulationRun> {
  const run = runs.find((r) => r.id === runId && r.projectId === projectId)
  if (!run) throw new Error(`Run ${runId} not found in project ${projectId}`)
  return run
}

export async function runSimulation(
  projectId: string,
  params: SimulationParameters
): Promise<SimulationRun> {
  const runId = `run-${Date.now()}`

  const prediction = await requestJson<BackendPredictResponse>("/predict", {
    method: "POST",
    body: JSON.stringify(toPredictPayload(params)),
  })

  const artifacts = buildRunArtifacts(runId, params, prediction)

  const newRun: SimulationRun = {
    id: runId,
    projectId,
    name: "Backend Prediction Run",
    status: "completed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: 1,
    parameters: params,
    summary: artifacts.summary,
  }

  runs = [newRun, ...runs]
  runResultsById.set(newRun.id, artifacts.results)
  runInsightsById.set(newRun.id, artifacts.insights)
  runLogsById.set(newRun.id, artifacts.logs)

  return newRun
}

// ── Results ──
export async function getResults(_projectId: string, runId: string): Promise<SimulationResults> {
  const results = runResultsById.get(runId)
  if (!results) throw new Error(`Results for run ${runId} not found`)
  return results
}

// ── AI ──
export async function getAIInsights(runId: string): Promise<AIInsights> {
  const insights = runInsightsById.get(runId)
  if (!insights) throw new Error(`AI insights for run ${runId} not found`)
  return insights
}

// ── Logs ──
export async function getLogs(runId: string): Promise<LogEntry[]> {
  return runLogsById.get(runId) ?? []
}

// ── Knowledge ──
export async function listKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  return []
}

export async function getKnowledgeDoc(docId: string): Promise<KnowledgeDocDetail> {
  throw new Error(`Knowledge doc ${docId} is not available from backend yet`)
}
