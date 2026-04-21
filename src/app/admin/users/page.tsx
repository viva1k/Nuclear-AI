"use client"

import * as React from "react"
import { UserPlus, MoreHorizontal, Shield, User, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface UserRecord {
  id: string
  name: string
  email: string
  role: "client" | "admin"
  status: "active" | "inactive"
  lastLogin: string
  projectCount: number
}

const initialUsers: UserRecord[] = [
  { id: "user-1", name: "Dr. Elena Vasquez", email: "e.vasquez@nuclear-ai.org", role: "client", status: "active", lastLogin: "2026-03-06T08:30:00Z", projectCount: 3 },
  { id: "user-2", name: "Dr. James Chen", email: "j.chen@nuclear-ai.org", role: "client", status: "active", lastLogin: "2026-03-05T14:20:00Z", projectCount: 2 },
  { id: "admin-1", name: "System Administrator", email: "admin@nuclear-ai.org", role: "admin", status: "active", lastLogin: "2026-03-06T09:00:00Z", projectCount: 0 },
  { id: "admin-2", name: "Operations Manager", email: "ops@nuclear-ai.org", role: "admin", status: "active", lastLogin: "2026-03-04T11:45:00Z", projectCount: 0 },
]

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = React.useState<UserRecord[]>(initialUsers)
  const [search, setSearch] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newEmail, setNewEmail] = React.useState("")
  const [newRole, setNewRole] = React.useState<"client" | "admin">("client")

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleAddUser() {
    if (!newName || !newEmail) return
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: "active",
      lastLogin: "Never",
      projectCount: 0,
    }
    setUsers([...users, newUser])
    toast({ title: "User created", description: `${newName} has been added.` })
    setOpen(false)
    setNewName("")
    setNewEmail("")
    setNewRole("client")
  }

  function toggleStatus(id: string) {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u
      )
    )
    toast({ title: "User status updated" })
  }

  function removeUser(id: string) {
    setUsers(users.filter((u) => u.id !== id))
    toast({ title: "User removed" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and permissions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account for the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="email@nuclear-ai.org" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "client" | "admin")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Researcher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Last Login</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Projects</th>
                  <th className="pb-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="py-3">
                      <Badge variant={user.role === "admin" ? "destructive" : "secondary"} className="gap-1">
                        {user.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <Badge variant={user.status === "active" ? "success" : "secondary"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 hidden md:table-cell text-muted-foreground">
                      {user.lastLogin === "Never" ? "Never" : new Date(user.lastLogin).toLocaleDateString()}
                    </td>
                    <td className="py-3 hidden lg:table-cell font-mono">{user.projectCount}</td>
                    <td className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(user.id)}>
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => removeUser(user.id)}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
