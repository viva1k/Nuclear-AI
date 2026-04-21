"use client"

import { AppShell } from "@/components/app-shell"
import { useRequireAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth("client")

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  return <AppShell>{children}</AppShell>
}
