"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle2,
} from "lucide-react"

const systemNodes = [
  {
    id: 1,
    name: "Simulation Node 1",
    icon: Cpu,
    status: "online" as const,
    cpu: 45,
    memory: 62,
    disk: 38,
    jobs: 2,
  },
  {
    id: 2,
    name: "Simulation Node 2",
    icon: Cpu,
    status: "online" as const,
    cpu: 72,
    memory: 78,
    disk: 55,
    jobs: 4,
  },
  {
    id: 3,
    name: "Simulation Node 3",
    icon: Cpu,
    status: "online" as const,
    cpu: 88,
    memory: 87,
    disk: 42,
    jobs: 6,
  },
  {
    id: 4,
    name: "Database Server",
    icon: Database,
    status: "online" as const,
    cpu: 22,
    memory: 45,
    disk: 67,
    jobs: 0,
  },
  {
    id: 5,
    name: "API Gateway",
    icon: Server,
    status: "online" as const,
    cpu: 15,
    memory: 30,
    disk: 20,
    jobs: 0,
  },
  {
    id: 6,
    name: "Storage Cluster",
    icon: HardDrive,
    status: "online" as const,
    cpu: 8,
    memory: 25,
    disk: 82,
    jobs: 0,
  },
]

function UsageBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function getBarColor(value: number) {
  if (value >= 85) return "bg-red-500"
  if (value >= 70) return "bg-yellow-500"
  return "bg-green-500"
}

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Monitoring</h1>
        <p className="text-muted-foreground">Real-time infrastructure status and resource usage</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15">
              <Wifi className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Services Online</p>
              <p className="text-2xl font-bold">6 / 6</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
              <Cpu className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">99.97%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nodes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {systemNodes.map((node) => {
          const Icon = node.icon
          return (
            <Card key={node.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {node.name}
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">{node.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">CPU</span>
                    <span className="font-mono">{node.cpu}%</span>
                  </div>
                  <UsageBar value={node.cpu} color={getBarColor(node.cpu)} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Memory</span>
                    <span className="font-mono">{node.memory}%</span>
                  </div>
                  <UsageBar value={node.memory} color={getBarColor(node.memory)} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Disk</span>
                    <span className="font-mono">{node.disk}%</span>
                  </div>
                  <UsageBar value={node.disk} color={getBarColor(node.disk)} />
                </div>
                {node.jobs > 0 && (
                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    Active jobs: <span className="font-mono font-medium text-foreground">{node.jobs}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
