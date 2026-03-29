"use client"

import * as React from "react"
import { Atom, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

export default function SignUpPage() {
  const router = useRouter()
  const { signup, user } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard")
    }
  }, [user, router])

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setTimeout(() => {
      const result = signup(name, email, password)
      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Sign up failed")
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

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to access simulations, projects, and the knowledge base</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@example.org"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : (<>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>)}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
