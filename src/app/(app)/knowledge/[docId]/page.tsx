"use client"

import Link from "next/link"
import { ArrowLeft, Brain, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useKnowledgeDoc } from "@/lib/hooks"
import { formatDate } from "@/lib/utils"
import * as React from "react"

export default function KnowledgeDocPage({
  params,
}: {
  params: { docId: string }
}) {
  const { docId } = params
  const { data: doc, isLoading } = useKnowledgeDoc(docId)
  const [aiExplainOpen, setAiExplainOpen] = React.useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!doc) {
    return <div className="py-20 text-center text-muted-foreground">Document not found</div>
  }

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/knowledge"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Badge variant="secondary">{doc.category}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">
            By {doc.author} · Updated {formatDate(doc.updatedAt)}
          </p>
          <div className="mt-2 flex gap-1">
            {doc.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>

        {/* Sections */}
        {doc.sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            {section.citations && section.citations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {section.citations.map((cite, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] gap-1">
                    <ExternalLink className="h-2.5 w-2.5" /> {cite}
                  </Badge>
                ))}
              </div>
            )}
            <Separator />
          </section>
        ))}
      </div>

      {/* AI Explain Side Panel */}
      <div className="hidden lg:block w-80 shrink-0">
        <Card className="sticky top-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Brain className="h-4 w-4" /> AI Explain
              </CardTitle>
              <Button
                variant={aiExplainOpen ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAiExplainOpen(!aiExplainOpen)}
              >
                {aiExplainOpen ? "Hide" : "Explain"}
              </Button>
            </div>
          </CardHeader>
          {aiExplainOpen && (
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="font-medium">Summary</p>
                <p className="text-muted-foreground leading-relaxed">
                  {doc.summary}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="font-medium">Key Sections</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {doc.sections.map((section) => (
                    <li key={section.id}>{section.title}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="font-medium">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-dashed p-2">
                <p className="text-[10px] text-muted-foreground text-center">
                  ⚠️ AI-generated — verify independently
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
