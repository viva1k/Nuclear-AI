"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Atom,
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useAuth, useRequireAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/system", label: "System", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth("admin")
  const { logout } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside
          className={`flex flex-col border-r bg-card transition-all duration-200 ${
            collapsed ? "w-16" : "w-56"
          }`}
        >
          {/* Logo */}
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
              <Atom className="h-4 w-4" />
            </div>
            {!collapsed && (
              <span className="text-sm font-bold truncate">Admin Panel</span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const btn = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-destructive/10 text-destructive font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                btn
              )
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className="p-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full text-muted-foreground hover:text-foreground ${collapsed ? "px-2" : "justify-start"}`}
              onClick={() => {
                logout()
              }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="ml-2">Sign out</span>}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </TooltipProvider>
  )
}
