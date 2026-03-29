"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, FolderKanban, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjects, useCreateProject } from "@/lib/hooks"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

const statusVariant = {
  active: "success" as const,
  archived: "secondary" as const,
  draft: "outline" as const,
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [reactorType, setReactorType] = React.useState("")

  function handleCreate() {
    if (!name || !reactorType) return
    createProject.mutate(
      { name, description, reactorType },
      {
        onSuccess: () => {
          toast({ title: "Project created", description: `"${name}" has been created.` })
          setOpen(false)
          setName("")
          setDescription("")
          setReactorType("")
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your reactor simulation projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Set up a new reactor simulation project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="proj-name">Project Name</Label>
                <Input
                  id="proj-name"
                  placeholder="e.g. PWR Baseline Study"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-desc">Description</Label>
                <Input
                  id="proj-desc"
                  placeholder="Brief description of the project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Reactor Type</Label>
                <Select value={reactorType} onValueChange={setReactorType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reactor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PWR">PWR — Pressurized Water</SelectItem>
                    <SelectItem value="BWR">BWR — Boiling Water</SelectItem>
                    <SelectItem value="SMR">SMR — Small Modular</SelectItem>
                    <SelectItem value="HTGR">HTGR — High-Temperature Gas</SelectItem>
                    <SelectItem value="SFR">SFR — Sodium-Cooled Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name || !reactorType || createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!projects?.length ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <FolderKanban className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No projects yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
                  <span className="text-xs text-muted-foreground">{project.reactorType}</span>
                </div>
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.runCount} runs</span>
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
                  <Link href={`/projects/${project.id}`}>
                    Open Project <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
