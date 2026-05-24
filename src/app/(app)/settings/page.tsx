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
import { updateProfile, updatePassword } from "@/lib/api"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user } = useAuth()

  const [name, setName] = React.useState(user?.name ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")
  const [emailNotifs, setEmailNotifs] = React.useState(true)
  const [autoSave, setAutoSave] = React.useState(true)
  const [tempUnit, setTempUnit] = React.useState("celsius")

  // Password fields
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordLoading, setPasswordLoading] = React.useState(false)
  const [profileLoading, setProfileLoading] = React.useState(false)

  async function handleSaveProfile() {
    setProfileLoading(true)
    try {
      await updateProfile(name, email)
      toast({ title: "Profile saved", description: "Your personal information has been updated." })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        title: "Error",
        description: error.message || "Failed to update profile preferences.",
        variant: "destructive",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast({ title: "Validation Error", description: "New password must be at least 8 characters long.", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Validation Error", description: "New passwords do not match.", variant: "destructive" })
      return
    }

    setPasswordLoading(true)
    try {
      await updatePassword(currentPassword, newPassword)
      toast({ title: "Success", description: "Your account password has been updated." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        title: "Security Error",
        description: error.message || "Failed to update password. Verify your current password.",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
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
            <Input id="role" defaultValue={user?.role ?? "researcher"} disabled className="capitalize" />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? "Saving..." : "Save Profile Details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your local account security password</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.role === "admin" ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-500 dark:text-amber-400">
              <p className="font-bold flex items-center gap-1.5 mb-1.5">
                <span>⚠️</span> Security Isolation Rule Active
              </p>
              <p className="text-xs leading-relaxed">
                As a system Administrator, you cannot change your credentials from standard account settings.
                Admin password changes are securely isolated and can only be performed via the dedicated **Admin Dashboard Settings** page.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
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
    </div>
  )
}
