'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { getSettings } from '@/lib/storage'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  context: string
  className?: string
}

export function AIChat({ context, className }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const settings = await getSettings()
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          apiKey: settings.gigaChatApiKey,
          model: settings.gigaChatModel,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка отправки сообщения')
      }

      const data = await response.json()
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.reply }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('[AI Chat] Error:', error)
      toast.error('Не удалось отправить сообщение')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={className}
        variant="outline"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Задать вопрос об анализе
      </Button>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Чат с AI
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] rounded-md border p-3" ref={scrollRef}>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Задайте вопрос об анализе текущего визита
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownViewer content={msg.content} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <p className="text-sm text-muted-foreground">Пишет...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите ваш вопрос..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
