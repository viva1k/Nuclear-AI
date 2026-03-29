// ── Project ──
export interface Project {
  id: string
  name: string
  description: string
  reactorType: string
  createdAt: string
  updatedAt: string
  status: "active" | "archived" | "draft"
  runCount: number
}

export interface CreateProjectPayload {
  name: string
  description: string
  reactorType: string
}

// ── Simulation Run ──
export type RunStatus = "pending" | "running" | "completed" | "failed" | "cancelled"

export interface SimulationRun {
  id: string
  projectId: string
  name: string
  status: RunStatus
  startedAt: string
  completedAt?: string
  duration?: number
  parameters: SimulationParameters
  summary?: RunSummary
}

export interface RunSummary {
  peakTemperature: number
  avgPowerOutput: number
  safetyMargin: number
  efficiencyRating: number
}

// ── Simulation Parameters ──
export interface SimulationParameters {
  core: {
    fuelType: string
    enrichmentLevel: number
    coreRadius: number
    coreHeight: number
  }
  thermal: {
    inletTemperature: number
    outletTemperature: number
    heatTransferCoefficient: number
    thermalConductivity: number
  }
  coolant: {
    coolantType: string
    flowRate: number
    pressure: number
    boilingPoint: number
  }
  controlRods: {
    rodCount: number
    insertionDepth: number
    materialType: string
    absorptionCrossSection: number
  }
  runtime: {
    simulationTime: number
    timeStep: number
    outputInterval: number
  }
  safetyThresholds: {
    maxTemperature: number
    maxPressure: number
    minCoolantFlow: number
    maxPowerLevel: number
  }
}

// ── Results ──
export interface TimeSeriesPoint {
  time: number
  value: number
}

export interface SimulationResults {
  runId: string
  temperatureHistory: TimeSeriesPoint[]
  powerHistory: TimeSeriesPoint[]
  pressureHistory: TimeSeriesPoint[]
  coolantFlowHistory: TimeSeriesPoint[]
  metrics: ResultMetrics
}

export interface ResultMetrics {
  peakTemperature: { value: number; unit: string; status: "normal" | "warning" | "critical" }
  avgPowerOutput: { value: number; unit: string; status: "normal" | "warning" | "critical" }
  thermalEfficiency: { value: number; unit: string; status: "normal" | "warning" | "critical" }
  coolantOutletTemp: { value: number; unit: string; status: "normal" | "warning" | "critical" }
  reactivityCoefficient: { value: number; unit: string; status: "normal" | "warning" | "critical" }
  safetyMargin: { value: number; unit: string; status: "normal" | "warning" | "critical" }
}

// ── AI Insights ──
export interface AIInsights {
  runId: string
  predictions: AIPrediction[]
  anomalies: AIAnomaly[]
  summary: string
}

export interface AIPrediction {
  id: string
  label: string
  description: string
  confidence: number
  type: "positive" | "neutral" | "warning"
}

export interface AIAnomaly {
  id: string
  title: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  timestamp: string
  parameter: string
}

// ── Knowledge ──
export interface KnowledgeDoc {
  id: string
  title: string
  category: string
  tags: string[]
  summary: string
  createdAt: string
  updatedAt: string
  author: string
}

export interface KnowledgeDocDetail extends KnowledgeDoc {
  sections: DocSection[]
}

export interface DocSection {
  id: string
  title: string
  content: string
  citations?: string[]
}

// ── Log ──
export type LogLevel = "info" | "warn" | "error" | "debug" | "success"

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  source?: string
}

// ── Dashboard ──
export interface DashboardData {
  totalProjects: number
  activeSimulations: number
  completedRuns: number
  avgEfficiency: number
  recentRuns: SimulationRun[]
}

// ── User ──
export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}
