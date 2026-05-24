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
import { updateAdminPassword } from "@/lib/api"

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

  // Password fields
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordLoading, setPasswordLoading] = React.useState(false)

  async function handleAdminPasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast({ title: "Validation Error", description: "Admin password must be at least 8 characters long.", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Validation Error", description: "Passwords do not match.", variant: "destructive" })
      return
    }

    setPasswordLoading(true)
    try {
      await updateAdminPassword(currentPassword, newPassword)
      toast({ title: "Success", description: "Admin account password updated successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        title: "Security Error",
        description: error.message || "Failed to update admin credentials. Check your current password.",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

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

      {/* Change Admin Password (Isolated Admin-only Flow) */}
      <Card>
        <CardHeader>
          <CardTitle>Change Admin Password</CardTitle>
          <CardDescription>Update your isolated administrator authentication credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminPasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-admin-password">Current Admin Password</Label>
              <Input
                id="current-admin-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current admin password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-admin-password">New Admin Password</Label>
              <Input
                id="new-admin-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-admin-password">Confirm New Admin Password</Label>
              <Input
                id="confirm-new-admin-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new admin password"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={passwordLoading} variant="destructive">
                {passwordLoading ? "Updating Admin..." : "Update Admin Password"}
              </Button>
            </div>
          </form>
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
