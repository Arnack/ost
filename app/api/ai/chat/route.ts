import { NextResponse } from 'next/server'
import { GigaChat } from 'gigachat'
import { Agent } from 'node:https'

export const runtime = 'nodejs'

function getErrorDetails(error: unknown): { message: string; status: number } {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: unknown } }).response
    const data = response?.data

    if (typeof data === 'string' && data.trim()) {
      return { message: data, status: response?.status || 500 }
    }

    if (data && typeof data === 'object') {
      const errorData = data as { message?: string; error?: string; error_description?: string }
      return {
        message: errorData.message || errorData.error_description || errorData.error || 'Ошибка GigaChat API',
        status: response?.status || 500,
      }
    }

    return { message: 'Ошибка GigaChat API', status: response?.status || 500 }
  }

  if (error instanceof Error && error.message) {
    return { message: error.message, status: 500 }
  }

  return { message: 'Внутренняя ошибка сервера', status: 500 }
}

export async function POST(request: Request) {
  try {
    const { messages, apiKey, model, context } = await request.json()
    const credentials = typeof apiKey === 'string' ? apiKey.trim().replace(/^Basic\s+/i, '') : ''
    const selectedModel = model || 'GigaChat'

    if (!credentials) {
      return NextResponse.json(
        { error: 'Ключ GigaChat не предоставлен' },
        { status: 400 }
      )
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Сообщения не предоставлены' },
        { status: 400 }
      )
    }

    const httpsAgent = new Agent({
      rejectUnauthorized: false,
    })

    const client = new GigaChat({
      credentials,
      scope: 'GIGACHAT_API_PERS',
      model: selectedModel,
      timeout: 600,
      httpsAgent,
    })

    const chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    if (context) {
      chatMessages.unshift({
        role: 'user',
        content: `КОНТЕКСТ СЕССИИ:\n${context}\n\nИспользуй этот контекст для ответов на вопросы. Отвечай на русском языке, профессионально но понятно.`,
      })
    }

    const data = await client.chat({
      model: selectedModel,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 2048,
    })

    const reply = data.choices?.[0]?.message?.content || 'Не удалось получить ответ'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[v0] AI chat error:', error)
    const { message, status } = getErrorDetails(error)

    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}
