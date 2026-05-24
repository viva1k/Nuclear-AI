"use client"

import * as React from "react"
import { Send, Terminal, Brain, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAIAssistant, useLatestRun } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import { defaultParameters } from "@/lib/simulation-defaults"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

function Typewriter({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = React.useState("")
  
  React.useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      setDisplayedText(() => text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return <span>{displayedText}</span>
}

const PHRASES = ["AI is thinking...", "Analyzing technical data...", "Preparing response...", "Consulting knowledge base..."]

function ThinkingIndicator() {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])


  return (
    <div className="flex flex-col items-start max-w-[85%] gap-1">
      <div className="px-4 py-3 bg-muted/50 border border-primary/10 rounded-2xl rounded-tl-none backdrop-blur-sm">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground px-1 font-mono uppercase tracking-wider animate-in fade-in duration-500">
        {PHRASES[index]}
      </span>
    </div>
  )
}

export function AIAssistant() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI technical assistant. I am connected to the current simulation data for context. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = React.useState("")
  const { data: latestRun } = useLatestRun()
  const { mutate: askAI, isPending } = useAIAssistant()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (!input.trim() || isPending) return

    const userMsg: Message = { role: "user", content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    // Call API with context
    askAI(
      { 
        query: input, 
        context: latestRun?.parameters || defaultParameters
      },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.response, timestamp: new Date() },
          ])
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Unable to generate response. Please check your connection and try again.", timestamp: new Date() },
          ])
        }
      }
    )
  }

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isPending])

  return (
    <Card className="flex flex-col h-[600px] border-primary/20 bg-background/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Animated background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-1000" />
      
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI Technical Assistant
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary uppercase">
                  Live Context
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">Nuclear Engineering Knowledge Hub</CardDescription>
            </div>
          </div>
          {latestRun && (
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <Activity className="h-3 w-3 text-green-500" />
                SYNCED: {latestRun.id.split('-')[1]}
              </div>
              <span className="text-[10px] text-primary/70 font-mono">
                T: {latestRun.parameters.thermal.outletTemperature}°C | P: {latestRun.parameters.coolant.pressure} bar
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <div className="h-full overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col max-w-[85%] gap-1",
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/50 border border-primary/10 rounded-tl-none backdrop-blur-sm"
                  )}
                >
                  {m.role === "assistant" && i === messages.length - 1 ? (
                    <Typewriter text={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isPending && <ThinkingIndicator />}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t bg-muted/20">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex w-full gap-2"
        >
          <div className="relative flex-1">
            <Input
              placeholder="Ask a technical question or about simulation data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pr-10 bg-background/50 border-primary/10 focus-visible:ring-primary/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
               <Terminal className="h-4 w-4" />
            </div>
          </div>
          <Button type="submit" size="icon" disabled={!input.trim() || isPending} className="shrink-0 shadow-lg shadow-primary/20">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
      
      {/* Suggestions */}
      <div className="px-4 pb-4 flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
        {["Current Status", "Safety Analysis", "Explain Thermal Physics"].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="text-[10px] px-2 py-1 rounded-full bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-primary font-medium"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </Card>
  )
}
