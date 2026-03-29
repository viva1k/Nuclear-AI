"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Moon, Sun, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/lib/auth"

const searchablePages = [
  { label: "Dashboard", href: "/dashboard", keywords: ["dashboard", "overview", "home"] },
  { label: "Projects", href: "/projects", keywords: ["projects", "simulation", "reactor"] },
  { label: "Knowledge Base", href: "/knowledge", keywords: ["knowledge", "docs", "documents", "papers"] },
  { label: "Settings", href: "/settings", keywords: ["settings", "preferences", "profile", "account"] },
]

type Notification = {
  id: number
  title: string
  description: string
  time: string
  read: boolean
  icon?: React.ElementType
  color?: string
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let path = ""
  for (const seg of segments) {
    path += `/${seg}`
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/[-_]/g, " ")
    crumbs.push({ label, href: path })
  }
  return crumbs
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const breadcrumbs = getBreadcrumbs(pathname)
  const displayName = user?.name ?? "User"
  const displayEmail = user?.email ?? ""
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const searchResults = searchQuery.length > 0
    ? searchablePages.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
      )
    : []

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function handleSearchSelect(href: string) {
    setSearchQuery("")
    setSearchOpen(false)
    router.push(href)
  }

  // Close search dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pages..."
            className="h-9 w-64 pl-8"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchOpen(false)
                setSearchQuery("")
              }
              if (e.key === "Enter" && searchResults.length > 0) {
                handleSearchSelect(searchResults[0].href)
              }
            }}
          />
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
              {searchResults.map((result) => (
                <button
                  key={result.href}
                  className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  onClick={() => handleSearchSelect(result.href)}
                >
                  {result.label}
                </button>
              ))}
            </div>
          )}
          {searchOpen && searchQuery.length > 0 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-3 shadow-md">
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-normal text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notif) => {
              const Icon = notif.icon
              return (
                <DropdownMenuItem key={notif.id} className="flex items-start gap-3 p-3 cursor-default">
                  {Icon ? <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${notif.color ?? "text-muted-foreground"}`} /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${notif.read ? "text-muted-foreground" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <Badge variant="info" className="h-4 text-[9px] px-1">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{notif.time}</p>
                  </div>
                </DropdownMenuItem>
              )
            })}
            {notifications.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground">No notifications yet.</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
