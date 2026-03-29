"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Play, RotateCcw, Save, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useRunSimulation } from "@/lib/hooks"
import { useToast } from "@/components/ui/use-toast"
import { defaultParameters, parameterPresets } from "@/lib/simulation-defaults"
import type { SimulationParameters } from "@/types"

const schema = z.object({
  core: z.object({
    fuelType: z.string().min(1),
    enrichmentLevel: z.coerce.number().min(0.7).max(20),
    coreRadius: z.coerce.number().min(0.5).max(5),
    coreHeight: z.coerce.number().min(1).max(10),
  }),
  thermal: z.object({
    inletTemperature: z.coerce.number().min(200).max(400),
    outletTemperature: z.coerce.number().min(250).max(450),
    heatTransferCoefficient: z.coerce.number().min(1000).max(100000),
    thermalConductivity: z.coerce.number().min(0.1).max(50),
  }),
  coolant: z.object({
    coolantType: z.string().min(1),
    flowRate: z.coerce.number().min(1000).max(50000),
    pressure: z.coerce.number().min(1).max(25),
    boilingPoint: z.coerce.number().min(100).max(500),
  }),
  controlRods: z.object({
    rodCount: z.coerce.number().int().min(1).max(200),
    insertionDepth: z.coerce.number().min(0).max(100),
    materialType: z.string().min(1),
    absorptionCrossSection: z.coerce.number().min(0.1).max(1000),
  }),
  runtime: z.object({
    simulationTime: z.coerce.number().min(60).max(86400),
    timeStep: z.coerce.number().min(0.001).max(10),
    outputInterval: z.coerce.number().min(1).max(3600),
  }),
  safetyThresholds: z.object({
    maxTemperature: z.coerce.number().min(500).max(3000),
    maxPressure: z.coerce.number().min(5).max(25),
    minCoolantFlow: z.coerce.number().min(1000).max(50000),
    maxPowerLevel: z.coerce.number().min(100).max(10000),
  }),
})

interface Props {
  projectId: string
  onRunStarted: (runId: string) => void
}

function FieldWithUnit({
  label,
  unit,
  tooltip,
  error,
  children,
}: {
  label: string
  unit?: string
  tooltip?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label className="text-xs">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="relative">
        {children}
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function SimulationParameterPanel({ projectId, onRunStarted }: Props) {
  const runMutation = useRunSimulation(projectId)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SimulationParameters>({
    resolver: zodResolver(schema),
    defaultValues: defaultParameters,
  })

  function onPreset(key: string) {
    const preset = parameterPresets[key]
    if (preset) reset(preset)
  }

  function onSubmit(data: SimulationParameters) {
    runMutation.mutate(data, {
      onSuccess: (run) => {
        toast({ title: "Simulation started", description: `Run ID: ${run.id}` })
        onRunStarted(run.id)
      },
      onError: () => {
        toast({ title: "Failed to start simulation", variant: "destructive" })
      },
    })
  }

  function onSave() {
    toast({ title: "Parameters saved", description: "Current parameters have been saved as a preset." })
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Parameters</CardTitle>
          <Select onValueChange={onPreset}>
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue placeholder="Load preset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baseline">Baseline</SelectItem>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="experimental">Experimental</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
        <form id="sim-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Core */}
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Core</h4>
            <div className="grid grid-cols-2 gap-3">
              <FieldWithUnit label="Fuel Type" error={errors.core?.fuelType?.message}>
                <Input className="h-8 text-xs" {...register("core.fuelType")} />
              </FieldWithUnit>
              <FieldWithUnit label="Enrichment" unit="%" tooltip="U-235 enrichment level" error={errors.core?.enrichmentLevel?.message}>
                <Input className="h-8 text-xs pr-8" type="number" step="0.1" {...register("core.enrichmentLevel")} />
              </FieldWithUnit>
              <FieldWithUnit label="Radius" unit="m" error={errors.core?.coreRadius?.message}>
                <Input className="h-8 text-xs pr-8" type="number" step="0.01" {...register("core.coreRadius")} />
              </FieldWithUnit>
              <FieldWithUnit label="Height" unit="m" error={errors.core?.coreHeight?.message}>
                <Input className="h-8 text-xs pr-8" type="number" step="0.01" {...register("core.coreHeight")} />
              </FieldWithUnit>
            </div>
          </section>

          <Separator />

          {/* Thermal */}
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Thermal</h4>
            <div className="grid grid-cols-2 gap-3">
              <FieldWithUnit label="Inlet Temp" unit="°C" error={errors.thermal?.inletTemperature?.message}>
                <Input className="h-8 text-xs pr-8" type="number" {...register("thermal.inletTemperature")} />
              </FieldWithUnit>
              <FieldWithUnit label="Outlet Temp" unit="°C" error={errors.thermal?.outletTemperature?.message}>
                <Input className="h-8 text-xs pr-8" type="number" {...register("thermal.outletTemperature")} />
              </FieldWithUnit>
              <FieldWithUnit label="Heat Transfer" unit="W/m²K" tooltip="Convective heat transfer coefficient" error={errors.thermal?.heatTransferCoefficient?.message}>
                <Input className="h-8 text-xs pr-14" type="number" {...register("thermal.heatTransferCoefficient")} />
              </FieldWithUnit>
              <FieldWithUnit label="Conductivity" unit="W/mK" error={errors.thermal?.thermalConductivity?.message}>
                <Input className="h-8 text-xs pr-12" type="number" step="0.1" {...register("thermal.thermalConductivity")} />
              </FieldWithUnit>
            </div>
          </section>

          <Separator />

          {/* Coolant */}
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coolant</h4>
            <div className="grid grid-cols-2 gap-3">
              <FieldWithUnit label="Coolant Type" error={errors.coolant?.coolantType?.message}>
                <Input className="h-8 text-xs" {...register("coolant.coolantType")} />
              </FieldWithUnit>
              <FieldWithUnit label="Flow Rate" unit="kg/s" error={errors.coolant?.flowRate?.message}>
                <Input className="h-8 text-xs pr-10" type="number" {...register("coolant.flowRate")} />
              </FieldWithUnit>
              <FieldWithUnit label="Pressure" unit="MPa" error={errors.coolant?.pressure?.message}>
                <Input className="h-8 text-xs pr-10" type="number" step="0.1" {...register("coolant.pressure")} />
              </FieldWithUnit>
              <FieldWithUnit label="Boiling Pt" unit="°C" error={errors.coolant?.boilingPoint?.message}>
                <Input className="h-8 text-xs pr-8" type="number" {...register("coolant.boilingPoint")} />
              </FieldWithUnit>
            </div>
          </section>

          <Separator />

          {/* Control Rods */}
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Control Rods</h4>
            <div className="grid grid-cols-2 gap-3">
              <FieldWithUnit label="Rod Count" error={errors.controlRods?.rodCount?.message}>
                <Input className="h-8 text-xs" type="number" {...register("controlRods.rodCount")} />
              </FieldWithUnit>
              <FieldWithUnit label="Insertion" unit="%" tooltip="Percentage of control rod insertion depth" error={errors.controlRods?.insertionDepth?.message}>
                <Input className="h-8 text-xs pr-8" type="number" {...register("controlRods.insertionDepth")} />
              </FieldWithUnit>
              <FieldWithUnit label="Material" error={errors.controlRods?.materialType?.message}>
                <Input className="h-8 text-xs" {...register("controlRods.materialType")} />
              </FieldWithUnit>
              <FieldWithUnit label="Absorption σ" unit="barn" tooltip="Neutron absorption cross-section" error={errors.controlRods?.absorptionCrossSection?.message}>
                <Input className="h-8 text-xs pr-10" type="number" step="0.1" {...register("controlRods.absorptionCrossSection")} />
              </FieldWithUnit>
            </div>
          </section>

          <Separator />

          {/* Runtime */}
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Runtime</h4>
            <div className="grid grid-cols-2 gap-3">
              <FieldWithUnit label="Sim Time" unit="s" error={errors.runtime?.simulationTime?.message}>
                <Input className="h-8 text-xs pr-6" type="number" {...register("runtime.simulationTime")} />
              </FieldWithUnit>
              <FieldWithUnit label="Time Step" unit="s" error={errors.runtime?.timeStep?.message}>
                <Input className="h-8 text-xs pr-6" type="number" step="0.01" {...register("runtime.timeStep")} />
              </FieldWithUnit>
              <FieldWithUnit label="Output Interval" unit="s" error={errors.runtime?.outputInterval?.message}>
                <Input className="h-8 text-xs pr-6" type="number" {...register("runtime.outputInterval")} />
              </FieldWithUnit>
            </div>
          </section>

          <Separator />

          {/* Safety Thresholds */}
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Safety Thresholds</h4>
            <div className="grid grid-cols-2 gap-3">
              <FieldWithUnit label="Max Temp" unit="°C" error={errors.safetyThresholds?.maxTemperature?.message}>
                <Input className="h-8 text-xs pr-8" type="number" {...register("safetyThresholds.maxTemperature")} />
              </FieldWithUnit>
              <FieldWithUnit label="Max Pressure" unit="MPa" error={errors.safetyThresholds?.maxPressure?.message}>
                <Input className="h-8 text-xs pr-10" type="number" step="0.1" {...register("safetyThresholds.maxPressure")} />
              </FieldWithUnit>
              <FieldWithUnit label="Min Flow" unit="kg/s" error={errors.safetyThresholds?.minCoolantFlow?.message}>
                <Input className="h-8 text-xs pr-10" type="number" {...register("safetyThresholds.minCoolantFlow")} />
              </FieldWithUnit>
              <FieldWithUnit label="Max Power" unit="MWt" error={errors.safetyThresholds?.maxPowerLevel?.message}>
                <Input className="h-8 text-xs pr-10" type="number" {...register("safetyThresholds.maxPowerLevel")} />
              </FieldWithUnit>
            </div>
          </section>
        </form>
      </CardContent>

      {/* Controls */}
      <div className="shrink-0 border-t p-3 flex gap-2">
        <Button
          type="submit"
          form="sim-form"
          size="sm"
          className="flex-1"
          disabled={runMutation.isPending}
        >
          <Play className="mr-1 h-3 w-3" />
          {runMutation.isPending ? "Running..." : "Run"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => reset(defaultParameters)}>
          <RotateCcw className="mr-1 h-3 w-3" /> Reset
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSave}>
          <Save className="mr-1 h-3 w-3" /> Save
        </Button>
      </div>
    </Card>
  )
}
