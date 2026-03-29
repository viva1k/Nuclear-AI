"use client"

import * as React from "react"
import { Atom, ArrowRight, Shield, User } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("e.vasquez@nuclear-ai.org")
  const [clientPassword, setClientPassword] = React.useState("password")
  const [adminEmail, setAdminEmail] = React.useState("admin@nuclear-ai.org")
  const [adminPassword, setAdminPassword] = React.useState("admin123")

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard")
    }
  }, [user, router])

  function handleClientLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setTimeout(() => {
      const result = login(clientEmail, clientPassword)
      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Login failed")
        setLoading(false)
      }
    }, 600)
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setTimeout(() => {
      const result = login(adminEmail, adminPassword)
      if (result.success) {
        router.push("/admin")
      } else {
        setError(result.error || "Login failed")
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Atom className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Nuclear AI</h1>
            <p className="text-sm text-muted-foreground">Reactor Simulation Platform</p>
          </div>
        </div>

        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client" className="gap-2">
              <User className="h-4 w-4" /> Researcher
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" /> Admin
            </TabsTrigger>
          </TabsList>

          {/* Client Login */}
          <TabsContent value="client">
            <Card>
              <CardHeader>
                <CardTitle>Researcher Sign In</CardTitle>
                <CardDescription>Access simulations, projects, and knowledge base</CardDescription>
              </CardHeader>
              <form onSubmit={handleClientLogin}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.vasquez@nuclear-ai.org"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password">Password</Label>
                    <Input
                      id="client-password"
                      type="password"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Demo credentials:</p>
                    <p>e.vasquez@nuclear-ai.org / password</p>
                    <p>j.chen@nuclear-ai.org / password</p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : (<>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>)}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/signup" className="text-primary underline-offset-4 hover:underline">
                      Sign up
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Admin Login */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Sign In</CardTitle>
                <CardDescription>Manage users, system settings, and platform operations</CardDescription>
              </CardHeader>
              <form onSubmit={handleAdminLogin}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@nuclear-ai.org"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Demo credentials:</p>
                    <p>admin@nuclear-ai.org / admin123</p>
                    <p>ops@nuclear-ai.org / admin123</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : (<>Sign in as Admin <Shield className="ml-2 h-4 w-4" /></>)}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
