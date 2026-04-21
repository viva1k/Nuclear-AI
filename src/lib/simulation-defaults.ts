import type { SimulationParameters } from "@/types"

export const defaultParameters: SimulationParameters = {
  core: {
    fuelType: "UO2",
    enrichmentLevel: 4.5,
    coreRadius: 1.5,
    coreHeight: 3.66,
  },
  thermal: {
    inletTemperature: 292,
    outletTemperature: 326,
    heatTransferCoefficient: 34000,
    thermalConductivity: 3.6,
  },
  coolant: {
    coolantType: "Light Water",
    flowRate: 17400,
    pressure: 15.5,
    boilingPoint: 345,
  },
  controlRods: {
    rodCount: 53,
    insertionDepth: 50,
    materialType: "Ag-In-Cd",
    absorptionCrossSection: 63.3,
  },
  runtime: {
    simulationTime: 3600,
    timeStep: 0.1,
    outputInterval: 10,
  },
  safetyThresholds: {
    maxTemperature: 1200,
    maxPressure: 17.2,
    minCoolantFlow: 12000,
    maxPowerLevel: 3400,
  },
}

export const parameterPresets: Record<string, SimulationParameters> = {
  baseline: defaultParameters,
  conservative: {
    ...defaultParameters,
    core: { ...defaultParameters.core, enrichmentLevel: 3.5 },
    controlRods: { ...defaultParameters.controlRods, insertionDepth: 65 },
    safetyThresholds: {
      maxTemperature: 1000,
      maxPressure: 15.5,
      minCoolantFlow: 14000,
      maxPowerLevel: 2800,
    },
  },
  experimental: {
    ...defaultParameters,
    core: { ...defaultParameters.core, enrichmentLevel: 5.5 },
    thermal: { ...defaultParameters.thermal, outletTemperature: 340 },
    controlRods: { ...defaultParameters.controlRods, insertionDepth: 30 },
    safetyThresholds: {
      maxTemperature: 1400,
      maxPressure: 18.0,
      minCoolantFlow: 10000,
      maxPowerLevel: 3800,
    },
  },
}
