"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Tag } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useKnowledgeDocs, useLatestRun, useGenerateAIReport } from "@/lib/hooks"
import { formatDate } from "@/lib/utils"
import { AIAssistant } from "@/features/knowledge/ai-assistant"
import { Sparkles, FileText, Loader2 } from "lucide-react"

export default function KnowledgePage() {
  const { data: docs, isLoading } = useKnowledgeDocs()
  const { data: latestRun } = useLatestRun()
  const { mutate: generateReport, data: reportData, isPending: isGenerating } = useGenerateAIReport()
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
      const matchTag = !selectedTag || d.tags.includes(selectedTag)
      return matchTag
    })
  }, [docs, selectedTag])


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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Knowledge Library</h1>
            <p className="text-muted-foreground">Technical documentation and AI-generated analysis</p>
          </div>
          {latestRun && (
             <Button 
              variant="outline" 
              className="gap-2 border-primary/20 hover:border-primary/50"
              onClick={() => generateReport(latestRun.parameters)}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              Generate AI Report
            </Button>
          )}
        </div>

        {/* Dynamic AI Report Display */}
        {reportData && (
          <Card className="border-primary/30 bg-primary/5 backdrop-blur-sm animate-in slide-in-from-top duration-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Live AI Analysis: {latestRun?.id}
              </CardTitle>
              <CardDescription>Comprehensive report synthesized from current reactor telemetry.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {reportData.response}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags Filter */}
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

        {/* Document List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No documents match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => (
              <Card key={doc.id} className="hover:border-primary/50 transition-colors bg-background/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-secondary/50">{doc.category}</Badge>
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
                        <Badge key={tag} variant="outline" className="text-[10px] border-primary/20">
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

      {/* AI Assistant Sidebar */}
      <div className="lg:col-span-4">
        <div className="sticky top-6">
          <AIAssistant />
        </div>
      </div>
    </div>
  )
}
