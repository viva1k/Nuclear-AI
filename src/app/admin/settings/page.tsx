"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function AdminSettingsPage() {
  const { toast } = useToast()

  const [platformName, setPlatformName] = React.useState("Nuclear AI")
  const [maxConcurrent, setMaxConcurrent] = React.useState("10")
  const [defaultTimeout, setDefaultTimeout] = React.useState("3600")
  const [require2FA, setRequire2FA] = React.useState(false)
  const [sessionTimeout, setSessionTimeout] = React.useState("60")
  const [ipAllowlist, setIpAllowlist] = React.useState(false)
  const [emailAlerts, setEmailAlerts] = React.useState(true)
  const [resourceAlerts, setResourceAlerts] = React.useState(true)
  const [newUserAlerts, setNewUserAlerts] = React.useState(true)

  function handleSave() {
    toast({ title: "Settings saved", description: "Admin settings have been updated." })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Platform-wide configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Platform Name</Label>
            <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Max Concurrent Simulations</Label>
            <Input type="number" value={maxConcurrent} onChange={(e) => setMaxConcurrent(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Default Simulation Timeout</Label>
            <Select value={defaultTimeout} onValueChange={setDefaultTimeout}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1800">30 minutes</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
                <SelectItem value="7200">2 hours</SelectItem>
                <SelectItem value="14400">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Authentication and access control</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">Enforce 2FA for all users</p>
            </div>
            <Switch checked={require2FA} onCheckedChange={setRequire2FA} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout</Label>
              <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>IP Allowlisting</Label>
              <p className="text-xs text-muted-foreground">Restrict access to specific IPs</p>
            </div>
            <Switch checked={ipAllowlist} onCheckedChange={setIpAllowlist} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>System alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email alerts for system errors</Label>
              <p className="text-xs text-muted-foreground">Send email when critical errors occur</p>
            </div>
            <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>High resource usage alerts</Label>
              <p className="text-xs text-muted-foreground">Alert when CPU/memory exceeds 90%</p>
            </div>
            <Switch checked={resourceAlerts} onCheckedChange={setResourceAlerts} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>New user registration notifications</Label>
              <p className="text-xs text-muted-foreground">Notify admins when new users are created</p>
            </div>
            <Switch checked={newUserAlerts} onCheckedChange={setNewUserAlerts} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}
