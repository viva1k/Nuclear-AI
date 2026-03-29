"use client"

import * as React from "react"
import Link from "next/link"
import { Search, BookOpen, Tag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useKnowledgeDocs } from "@/lib/hooks"
import { formatDate } from "@/lib/utils"

export default function KnowledgePage() {
  const { data: docs, isLoading } = useKnowledgeDocs()
  const [search, setSearch] = React.useState("")
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null)

  // Collect all tags
  const allTags = React.useMemo(() => {
    if (!docs) return []
    const tags = new Set<string>()
    docs.forEach((d) => d.tags.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }, [docs])

  // Filter
  const filtered = React.useMemo(() => {
    if (!docs) return []
    return docs.filter((d) => {
      const matchSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.summary.toLowerCase().includes(search.toLowerCase())
      const matchTag = !selectedTag || d.tags.includes(selectedTag)
      return matchSearch && matchTag
    })
  }, [docs, search, selectedTag])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Library</h1>
        <p className="text-muted-foreground">Technical documentation and reference materials</p>
      </div>

      {/* Search + Tags */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search knowledge base"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No documents match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{doc.category}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</span>
                </div>
                <CardTitle className="text-base">
                  <Link href={`/knowledge/${doc.id}`} className="hover:text-primary transition-colors">
                    {doc.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">{doc.summary}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        <Tag className="mr-1 h-2.5 w-2.5" /> {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">by {doc.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
