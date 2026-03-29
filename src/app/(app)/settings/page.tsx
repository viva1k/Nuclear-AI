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
import { useTheme } from "@/components/theme-provider"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user } = useAuth()

  const [name, setName] = React.useState(user?.name ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")
  const [emailNotifs, setEmailNotifs] = React.useState(true)
  const [autoSave, setAutoSave] = React.useState(true)
  const [tempUnit, setTempUnit] = React.useState("celsius")

  function handleSave() {
    toast({ title: "Settings saved", description: "Your preferences have been updated." })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" defaultValue={user?.role ?? "researcher"} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground">Select the UI color scheme</p>
            </div>
            <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive email when simulations complete</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} aria-label="Email notifications" />
          </div>

          <Separator />

          {/* Auto-save */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-save Configurations</Label>
              <p className="text-xs text-muted-foreground">Automatically save simulation parameters</p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} aria-label="Auto-save configurations" />
          </div>

          <Separator />

          {/* Units */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Temperature Unit</Label>
              <p className="text-xs text-muted-foreground">Default temperature display unit</p>
            </div>
            <Select value={tempUnit} onValueChange={setTempUnit}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celsius">Celsius (°C)</SelectItem>
                <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                <SelectItem value="kelvin">Kelvin (K)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
}
