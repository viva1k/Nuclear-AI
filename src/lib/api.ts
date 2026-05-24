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

type BackendAIResponse = {
  response: string
}

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

// ── Persistence Helper ──
const STORAGE_KEYS = {
  PROJECTS: "nuclear_ai_projects",
  RUNS: "nuclear_ai_runs",
  RESULTS: "nuclear_ai_results",
  INSIGHTS: "nuclear_ai_insights",
  LOGS: "nuclear_ai_logs",
}

function load<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  const saved = localStorage.getItem(key)
  if (!saved) return defaultValue
  try {
    return JSON.parse(saved) as T
  } catch (e) {
    console.error(`Failed to load ${key}`, e)
    return defaultValue
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Stateful stores (persist during session) ──
let projects: Project[] = load(STORAGE_KEYS.PROJECTS, [])
let runs: SimulationRun[] = load(STORAGE_KEYS.RUNS, [])

// Use objects instead of Maps for easier JSON serialization in localStorage
const runResultsById: Record<string, SimulationResults> = load(STORAGE_KEYS.RESULTS, {})
const runInsightsById: Record<string, AIInsights> = load(STORAGE_KEYS.INSIGHTS, {})
const runLogsById: Record<string, LogEntry[]> = load(STORAGE_KEYS.LOGS, {})


function persistAll() {
  save(STORAGE_KEYS.PROJECTS, projects)
  save(STORAGE_KEYS.RUNS, runs)
  save(STORAGE_KEYS.RESULTS, runResultsById)
  save(STORAGE_KEYS.INSIGHTS, runInsightsById)
  save(STORAGE_KEYS.LOGS, runLogsById)
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("nuclear-ai-token") : null

  const headers = new Headers()
  headers.set("Content-Type", "application/json")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (init?.headers) {
    const initHeaders = new Headers(init.headers)
    initHeaders.forEach((value, key) => {
      headers.set(key, value)
    })
  }

  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response.text()
    let errMsg = `API request failed (${response.status})`
    try {
      const parsed = JSON.parse(body)
      if (parsed && parsed.detail) {
        if (typeof parsed.detail === "string") {
          errMsg = parsed.detail
        } else if (Array.isArray(parsed.detail) && parsed.detail[0]?.message) {
          errMsg = parsed.detail[0].message
        }
      }
    } catch {
      if (body) errMsg += `: ${body}`
    }
    throw new Error(errMsg)
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

/**
 * Enhanced series builder that simulates reactor dynamics
 */
function buildReactorSeries(
  params: SimulationParameters,
  metric: "temperature" | "power" | "pressure" | "flow",
  baseValue: number,
  isCritical: boolean
): { time: number; value: number }[] {
  const points = Math.min(200, Math.ceil(params.runtime.simulationTime / params.runtime.timeStep / 10))
  const data: { time: number; value: number }[] = []
  
  // Physics-based multipliers
  const rodEffect = (100 - params.controlRods.insertionDepth) / 100 // 0 to 1
  const flowEffect = params.coolant.flowRate / 25000 // normalized around 25k
  const enrichmentEffect = params.core.enrichmentLevel / 5 // normalized around 5%
  
  let currentVal = baseValue
  const noise = baseValue * 0.005

  for (let i = 0; i < points; i++) {
    const time = i * (params.runtime.simulationTime / points)
    
    // Simulate trend towards a steady state or meltdown
    let trend = 0
    if (metric === "temperature") {
      trend = (enrichmentEffect * rodEffect * 10) - (flowEffect * 8)
      if (isCritical) trend += 15 // Rapid heat up
    } else if (metric === "power") {
      trend = (enrichmentEffect * rodEffect * 50) - 25
      if (isCritical) trend += 100
    } else if (metric === "pressure") {
      trend = (currentVal * 0.01) * (isCritical ? 2 : 0.2)
    }
    
    currentVal += trend + (Math.random() - 0.5) * noise
    
    // Clamp to semi-realistic ranges
    if (metric === "temperature") currentVal = Math.max(params.thermal.inletTemperature, currentVal)
    if (metric === "power") currentVal = Math.max(0, currentVal)
    if (metric === "flow") currentVal = params.coolant.flowRate + (Math.random() - 0.5) * 50

    data.push({ time: Math.round(time), value: Number(currentVal.toFixed(2)) })
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

  // Calculate realistic summary metrics based on parameters
  const rodFactor = (100 - params.controlRods.insertionDepth) / 100
  const enrichmentFactor = params.core.enrichmentLevel / 4
  
  const peakTemperature = params.thermal.outletTemperature + (enrichmentFactor * rodFactor * 150) * (isCritical ? 2 : 1)
  const avgPowerOutput = Math.min(params.safetyThresholds.maxPowerLevel, 3000 * enrichmentFactor * rodFactor + (isCritical ? 2000 : 0))
  const safetyMargin = Number((Math.max(0, (params.safetyThresholds.maxTemperature - peakTemperature) / params.safetyThresholds.maxTemperature)).toFixed(3))
  const efficiencyRating = Number((Math.max(0.1, 0.35 + (params.thermal.outletTemperature - params.thermal.inletTemperature) / 1000)).toFixed(3))

  const summary = {
    peakTemperature,
    avgPowerOutput,
    safetyMargin,
    efficiencyRating,
  }

  const results: SimulationResults = {
    runId,
    temperatureHistory: buildReactorSeries(params, "temperature", params.thermal.outletTemperature, isCritical),
    powerHistory: buildReactorSeries(params, "power", avgPowerOutput * 0.8, isCritical),
    pressureHistory: buildReactorSeries(params, "pressure", params.coolant.pressure, isCritical),
    coolantFlowHistory: buildReactorSeries(params, "flow", params.coolant.flowRate, isCritical),
    metrics: {
      peakTemperature: {
        value: peakTemperature,
        unit: "°C",
        status: peakTemperature > params.safetyThresholds.maxTemperature ? "critical" : peakTemperature > params.safetyThresholds.maxTemperature * 0.8 ? "warning" : "normal",
      },
      avgPowerOutput: { value: avgPowerOutput, unit: "MWt", status: avgPowerOutput > params.safetyThresholds.maxPowerLevel ? "critical" : "normal" },
      thermalEfficiency: { value: Number((efficiencyRating * 100).toFixed(2)), unit: "%", status: "normal" },
      coolantOutletTemp: {
        value: params.thermal.outletTemperature,
        unit: "°C",
        status: params.thermal.outletTemperature > params.safetyThresholds.maxTemperature ? "critical" : "normal",
      },
      reactivityCoefficient: { value: Number((-2 - (100 - params.controlRods.insertionDepth) / 10).toFixed(2)), unit: "pcm/°C", status: "normal" },
      safetyMargin: {
        value: Number((safetyMargin * 100).toFixed(2)),
        unit: "%",
        status: safetyMargin < 0.15 ? "critical" : safetyMargin < 0.4 ? "warning" : "normal",
      },
    },
  }

  const insights: AIInsights = {
    runId,
    predictions: [
      {
        id: `${runId}-prediction-1`,
        label: prediction.analysis,
        description: `Backend model confidence reported at ${prediction.confidence_level} based on current thermal and coolant parameters.`,
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
            description: "The backend model flagged this run as critical. High enrichment and low rod insertion detected.",
            timestamp: new Date().toISOString(),
            parameter: "analysis",
          },
        ]
      : safetyMargin < 0.3 ? [
          {
            id: `${runId}-anomaly-2`,
            title: "Reduced Safety Margin",
            severity: "medium",
            description: "Core temperature approaching safety thresholds. Monitor coolant flow.",
            timestamp: new Date().toISOString(),
            parameter: "temperature",
          }
      ] : [],
    summary: `Prediction: ${prediction.analysis}. Confidence: ${prediction.confidence_level}. Simulation based on ${params.core.fuelType} fuel.`,
  }

  const logs: LogEntry[] = [
    {
      id: `${runId}-log-1`,
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Submitting parameters to backend model...",
      source: "api",
    },
    {
      id: `${runId}-log-2`,
      timestamp: new Date(Date.now() + 500).toISOString(),
      level: "success",
      message: "Parameters received. Analyzing core dynamics...",
      source: "backend",
    },
    {
      id: `${runId}-log-3`,
      timestamp: new Date(Date.now() + 1200).toISOString(),
      level: isCritical ? "warn" : "success",
      message: `Model Result: ${prediction.analysis} (Confidence: ${prediction.confidence_level})`,
      source: "backend",
    },
    {
      id: `${runId}-log-4`,
      timestamp: new Date(Date.now() + 2000).toISOString(),
      level: "info",
      message: "Time-series simulation artifacts generated.",
      source: "api",
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

  // Generate performance trend from last 10 completed runs
  const performanceTrend = completedRuns
    .slice(0, 10)
    .reverse()
    .map(run => ({
      date: new Date(run.completedAt || run.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      efficiency: Number(((run.summary?.efficiencyRating ?? 0) * 100).toFixed(1)),
      safety: Number(((run.summary?.safetyMargin ?? 0) * 100).toFixed(1)),
    }))

  return {
    totalProjects: projects.length,
    activeSimulations: runs.filter((r) => r.status === "running").length,
    completedRuns: completedRuns.length,
    avgEfficiency,
    recentRuns: runs.slice(0, 5),
    performanceTrend,
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
  persistAll()
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
  
  // 1. Initial pending run
  const newRun: SimulationRun = {
    id: runId,
    projectId,
    name: `Run ${new Date().toLocaleTimeString()}`,
    status: "running",
    startedAt: new Date().toISOString(),
    parameters: params,
  }

  runs = [newRun, ...runs]
  persistAll()

  // 2. Perform backend prediction
  try {
    const prediction = await requestJson<BackendPredictResponse>("/predict", {
      method: "POST",
      body: JSON.stringify(toPredictPayload(params)),
    })

    const artifacts = buildRunArtifacts(runId, params, prediction)

    // 3. Complete run
    const completedRun: SimulationRun = {
      ...newRun,
      status: "completed",
      completedAt: new Date().toISOString(),
      duration: Math.min(params.runtime.simulationTime, 10), // Simulate that it took some time
      summary: artifacts.summary,
    }

    // Update in-memory and storage
    runs = runs.map(r => r.id === runId ? completedRun : r)
    runResultsById[runId] = artifacts.results
    runInsightsById[runId] = artifacts.insights
    runLogsById[runId] = artifacts.logs
    
    // Update project run count
    projects = projects.map(p => p.id === projectId ? { ...p, runCount: p.runCount + 1, updatedAt: new Date().toISOString() } : p)
    
    persistAll()
    return completedRun
  } catch (error) {
    const failedRun: SimulationRun = {
      ...newRun,
      status: "failed",
      completedAt: new Date().toISOString(),
    }
    runs = runs.map(r => r.id === runId ? failedRun : r)
    persistAll()
    throw error
  }
}

// ── Results ──
export async function getResults(_projectId: string, runId: string): Promise<SimulationResults> {
  const results = runResultsById[runId]
  if (!results) throw new Error(`Results for run ${runId} not found`)
  return results
}

// ── AI ──
export async function getAIInsights(runId: string): Promise<AIInsights> {
  const insights = runInsightsById[runId]
  if (!insights) throw new Error(`AI insights for run ${runId} not found`)
  return insights
}

export async function askAIAssistant(query: string, contextParams: SimulationParameters): Promise<{ response: string }> {
  return requestJson<BackendAIResponse>("/ai-assistant", {
    method: "POST",
    body: JSON.stringify({
      query,
      context: toPredictPayload(contextParams),
    }),
  })
}

export function getLatestRun(): SimulationRun | null {
  const completed = runs.filter(r => r.status === "completed")
  return completed.length > 0 ? completed[0] : (runs.length > 0 ? runs[0] : null)
}

export async function generateAIReport(contextParams: SimulationParameters): Promise<{ response: string }> {
  return requestJson<BackendAIResponse>("/generate-report", {
    method: "POST",
    body: JSON.stringify({
      query: "Generate full technical report",
      context: toPredictPayload(contextParams),
    }),
  })
}

// ── Logs ──
export async function getLogs(runId: string): Promise<LogEntry[]> {
  return runLogsById[runId] ?? []
}

// ── Knowledge ──
const knowledgeDocs: KnowledgeDocDetail[] = [
  {
    id: "reactor-physics-basics",
    title: "Core Neutronics and Reactivity Control",
    category: "Physics",
    tags: ["neutron-flux", "reactivity", "moderation"],
    summary: "An advanced overview of how enrichment levels and control rod positioning determine the multiplication factor (k-eff) of a nuclear reactor.",
    author: "Dr. Aris Thorne",
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-04-20T14:30:00Z",
    sections: [
      {
        id: "sec-1",
        title: "The Four-Factor Formula",
        content: "Understanding the multiplication factor requires analyzing the reproduction of neutrons. The four-factor formula (ε, p, f, η) describes the lifecycle of a neutron from birth to absorption. In our simulation, 'Enrichment Level' directly impacts η (reproduction factor), while 'Rod Insertion' affects f (thermal utilization factor).",
        citations: ["Lamarsh, Introduction to Nuclear Engineering", "Duderstadt, Nuclear Reactor Analysis"]
      },
      {
        id: "sec-2",
        title: "Control Rod Dynamics",
        content: "Control rods are made of high-absorption cross-section materials like Boron-10 or Hafnium. When inserted, they decrease the thermal utilization factor by competing with fuel for neutrons. A critical state (k=1) is achieved when production equals loss. Our simulation uses the 'Absorption σ' parameter to model this behavior.",
        citations: ["Glasstone, Nuclear Reactor Theory"]
      }
    ]
  },
  {
    id: "thermal-hydraulics-101",
    title: "Thermal-Hydraulic Systems and Coolant Flow",
    category: "Engineering",
    tags: ["heat-transfer", "coolant", "pressure"],
    summary: "Deep dive into the cooling systems that prevent core meltdowns and how flow rate correlates with thermal efficiency.",
    author: "Ing. Sarah Chen",
    createdAt: "2026-03-18T09:00:00Z",
    updatedAt: "2026-04-21T11:20:00Z",
    sections: [
      {
        id: "sec-1",
        title: "Convective Heat Transfer",
        content: "Heat removal from fuel rods depends on the convective heat transfer coefficient (h). The flow rate (kg/s) and coolant type determine the Reynolds number, which in turn influences the Nusselt number. Increasing the flow rate improves heat removal but requires higher pumping power.",
        citations: ["Todreas & Kazimi, Nuclear Systems Vol. 1"]
      },
      {
        id: "sec-2",
        title: "Boiling and Critical Heat Flux",
        content: "A major safety concern is Departure from Nucleate Boiling (DNB). If the fuel surface temperature exceeds the boiling point of the coolant significantly, a steam film may form, drastically reducing the heat transfer coefficient and leading to rapid temperature spikes (meltdown risk).",
        citations: ["Incropera, Fundamentals of Heat and Mass Transfer"]
      }
    ]
  },
  {
    id: "ai-safety-analysis",
    title: "AI-Driven Predictive Safety Margins",
    category: "AI/Safety",
    tags: ["machine-learning", "anomaly-detection", "risk-assessment"],
    summary: "How the simulation's Random Forest model analyzes 5 key sensors to predict critical states before they occur.",
    author: "AI Research Team",
    createdAt: "2026-04-01T15:00:00Z",
    updatedAt: "2026-04-22T08:00:00Z",
    sections: [
      {
        id: "sec-1",
        title: "Feature Correlation in Nuclear Safety",
        content: "The AI model (model.pkl) is trained on 5 primary features: Temperature, Pressure, Vibration, Radiation, and Coolant Flow. The most critical correlation detected by our research is the (Temperature ↑ / Flow ↓) inverse relationship, which is the primary indicator of a meltdown risk.",
      },
      {
        id: "sec-2",
        title: "Confidence Levels and Decision Support",
        content: "The 'Confidence Level' returned by the backend represents the probability that the current state belongs to the 'STABLE' or 'CRITICAL' class. A confidence below 70% usually indicates an edge case or 'unseen' parameter space, suggesting operator intervention or manual threshold verification.",
      }
    ]
  },
  {
    id: "curated-resources",
    title: "Curated Learning Resources & References",
    category: "General",
    tags: ["education", "resources", "reading-list"],
    summary: "A comprehensive list of books, journals, and technical databases for advanced nuclear engineering studies.",
    author: "Library Curator",
    createdAt: "2026-04-10T12:00:00Z",
    updatedAt: "2026-04-22T20:00:00Z",
    sections: [
      {
        id: "books",
        title: "Standard Textbooks",
        content: "1. 'Introduction to Nuclear Engineering' by John R. Lamarsh & Anthony J. Baratta.\n2. 'Nuclear Reactor Analysis' by James J. Duderstadt & Louis J. Hamilton.\n3. 'Thermal Analysis of Pressurized Water Reactors' by L.S. Tong & Joel Weisman.",
      },
      {
        id: "databases",
        title: "Technical Databases",
        content: "1. IAEA Nuclear Data Section (NDS) - Access to ENDF/B libraries.\n2. OECD/NEA Computer Program Services (CPS) - Codes like MCNP, RELAP, and SCALE.\n3. NRC Technical Training Center - Reactor Concepts Manuals.",
      }
    ]
  }
]

export async function listKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  // Return a summary version for the list
  return knowledgeDocs.map((doc) => {
    const { id, title, category, tags, summary, createdAt, updatedAt, author } = doc
    return { id, title, category, tags, summary, createdAt, updatedAt, author }
  })
}

export async function getKnowledgeDoc(docId: string): Promise<KnowledgeDocDetail> {
  const doc = knowledgeDocs.find((d) => d.id === docId)
  if (!doc) throw new Error(`Knowledge doc ${docId} not found`)
  return doc
}

// ── Profile & Password Management ──
export interface DbUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export async function updateProfile(name: string, email: string): Promise<{ message: string; user: DbUser }> {
  return requestJson<{ message: string; user: DbUser }>("/users/profile", {
    method: "PUT",
    body: JSON.stringify({ name, email }),
  })
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return requestJson<{ message: string }>("/users/password", {
    method: "PUT",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

export async function updateAdminPassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return requestJson<{ message: string }>("/admin/password", {
    method: "PUT",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}


