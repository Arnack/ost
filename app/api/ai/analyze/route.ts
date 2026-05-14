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
    const { prompt, apiKey, model } = await request.json()
    const credentials = typeof apiKey === 'string' ? apiKey.trim().replace(/^Basic\s+/i, '') : ''
    const selectedModel = model || 'GigaChat'

    if (!credentials) {
      return NextResponse.json(
        { error: 'Ключ GigaChat не предоставлен' },
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

    const data = await client.chat({
      model: selectedModel,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    })
    const analysis = data.choices?.[0]?.message?.content || 'Не удалось получить ответ'

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[v0] AI analyze error:', error)
    const { message, status } = getErrorDetails(error)

    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}
