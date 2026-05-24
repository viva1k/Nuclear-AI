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

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleWindow extends Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: { client_id: string; callback: (res: GoogleCredentialResponse) => void }) => void;
        renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void;
      };
    };
  };
}

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, user } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPassword, setClientPassword] = React.useState("")
  const [adminEmail, setAdminEmail] = React.useState("")
  const [adminPassword, setAdminPassword] = React.useState("")

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // Load Google Identity Services script
  React.useEffect(() => {
    if (!googleClientId) return

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [googleClientId])

  // Initialize and render Google Sign-In Button
  React.useEffect(() => {
    if (!googleClientId) return

    if (typeof window !== "undefined") {
      const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
        setLoading(true)
        setError("")
        try {
          const result = await loginWithGoogle(response.credential)
          if (result.success) {
            router.push("/dashboard")
          } else {
            setError(result.error || "Google Sign-In failed")
            setLoading(false)
          }
        } catch (err) {
          console.error("Google Sign-In error:", err)
          setError("An unexpected error occurred during Google Sign-In.")
          setLoading(false)
        }
      }

      const checkGoogle = setInterval(() => {
        const googleWindow = window as unknown as GoogleWindow
        if (googleWindow.google) {
          clearInterval(checkGoogle)
          googleWindow.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          })

          const parentElem = document.getElementById("google-signin-btn")
          if (parentElem) {
            googleWindow.google.accounts.id.renderButton(parentElem, {
              theme: "outline",
              size: "large",
              width: 382,
            })
          }
        }
      }, 500)

      return () => clearInterval(checkGoogle)
    }
  }, [loginWithGoogle, router, googleClientId])

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard")
    }
  }, [user, router])

  async function handleClientLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await login(clientEmail, clientPassword)
      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Login failed")
        setLoading(false)
      }
    } catch (err) {
      console.error("Client login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await login(adminEmail, adminPassword)
      if (result.success) {
        router.push("/admin")
      } else {
        setError(result.error || "Login failed")
        setLoading(false)
      }
    } catch (err) {
      console.error("Admin login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
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
                      placeholder="Enter your email"
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
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : (<>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>)}
                  </Button>

                  {googleClientId && (
                    <>
                      <div className="relative w-full my-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <div id="google-signin-btn" className="flex justify-center w-full min-h-[40px]" />
                    </>
                  )}

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
                      placeholder="Enter your email"
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
