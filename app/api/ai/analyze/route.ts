import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { prompt, apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API ключ не предоставлен' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[v0] Claude API error response:', errorData)
      return NextResponse.json(
        { error: 'Ошибка Claude API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const analysis = data.content?.[0]?.text || 'Не удалось получить ответ'

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[v0] AI analyze error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
