import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { prompt, apiKey, model } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Ключ GigaChat не предоставлен' },
        { status: 400 }
      )
    }

    const tokenResponse = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${apiKey}`,
        'RqUID': crypto.randomUUID(),
      },
      body: new URLSearchParams({ scope: 'GIGACHAT_API_PERS' }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('[v0] GigaChat token error response:', errorData)
      return NextResponse.json(
        { error: 'Ошибка авторизации GigaChat' },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'GigaChat не вернул access token' },
        { status: 502 }
      )
    }

    const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        model: model || 'GigaChat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[v0] GigaChat API error response:', errorData)
      return NextResponse.json(
        { error: 'Ошибка GigaChat API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content || 'Не удалось получить ответ'

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[v0] AI analyze error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
