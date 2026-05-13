import type { Client, Visit } from './types'
import { getSettings } from './storage'

export interface AnalysisResult {
  summary: string
  recommendations: string[]
  concerns: string[]
}

function formatVisitForAnalysis(visit: Visit, client: Client): string {
  const spineIssues = visit.spineData.segments
    .filter((s) => s.status !== 'normal')
    .map((s) => `${s.name}: ${s.status}`)
    .join(', ')

  const neuroResults = visit.neuroTests
    .map((test) => {
      const results = Object.entries(test.results)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ')
      return `${test.name}: ${results || '—'}`
    })
    .join('; ')

  const bodyIssues = visit.bodyRegions.regions
    .filter((r) => r.status !== 'neutral')
    .map((r) => `${r.name} (${r.status})`)
    .join(', ')

  const brokenChains = visit.muscleChains.chains
    .filter((c) => c.status === 'break' || c.leftStatus === 'break' || c.rightStatus === 'break')
    .map((c) => `${c.name}: общ=${c.status}, лев=${c.leftStatus || '—'}, прав=${c.rightStatus || '—'}`)
    .join(', ')

  const gravityPatterns = [
    ['Дыхание', visit.gravityData.pattern4_breathing],
    ['Правый шаг', visit.gravityData.pattern4_rightStep],
    ['Левый шаг', visit.gravityData.pattern4_leftStep],
    ['Вертикаль', visit.gravityData.pattern4_vertical],
  ]
    .map(([name, pattern]) => {
      if (!pattern || typeof pattern !== 'object') return ''
      return `${name}: верх Л/П=${pattern.upperLeft}/${pattern.upperRight}, низ Л/П=${pattern.lowerLeft}/${pattern.lowerRight}`
    })
    .filter(Boolean)
    .join('; ')

  const gravityInfo = [
    `Передне-задний: верх=${visit.gravityData.anteriorPosterior.upper}, низ=${visit.gravityData.anteriorPosterior.lower}`,
    `Лево-правый: верх=${visit.gravityData.leftRight.upper}, низ=${visit.gravityData.leftRight.lower}`,
    gravityPatterns,
    `Вес: лев=${visit.gravityData.weightLeft}кг, прав=${visit.gravityData.weightRight}кг, всего=${visit.gravityData.totalWeight || 0}кг`,
    `Энергозатраты: лев=${visit.gravityData.leftCost || 0}, прав=${visit.gravityData.rightCost || 0}`,
    `Отмеченные пальцы: ${(visit.gravityData.markedToes || []).join(', ') || '—'}`,
  ].filter(Boolean).join('\n')

  return `
ДАННЫЕ ВИЗИТА:
Дата: ${visit.date}
Клиент: ${client.name}

АНАМНЕЗ:
${client.anamnesis.symptoms ? `Симптомы: ${client.anamnesis.symptoms}` : ''}
${client.anamnesis.firstSymptoms ? `Первые симптомы: ${client.anamnesis.firstSymptoms}` : ''}
${client.anamnesis.complaints ? `Жалобы: ${client.anamnesis.complaints}` : ''}
${client.anamnesis.injuries ? `Травмы: ${client.anamnesis.injuries}` : ''}
${client.anamnesis.scars ? `Шрамы: ${client.anamnesis.scars}` : ''}
${client.anamnesis.medications ? `Препараты: ${client.anamnesis.medications}` : ''}
${client.anamnesis.birthTraumas ? `Родовые травмы: ${client.anamnesis.birthTraumas}` : ''}
${client.anamnesis.sleepPositions ? `Позы сна: ${client.anamnesis.sleepPositions}` : ''}
${client.anamnesis.specialists ? `Специалисты: ${client.anamnesis.specialists}` : ''}
${client.anamnesis.treatment ? `Лечение: ${client.anamnesis.treatment}` : ''}
${client.anamnesis.treatmentResult ? `Результат лечения: ${client.anamnesis.treatmentResult}` : ''}
${client.anamnesis.diagnosis ? `Диагноз: ${client.anamnesis.diagnosis}` : ''}
${client.anamnesis.additionalInfo ? `Дополнительно: ${client.anamnesis.additionalInfo}` : ''}
${client.anamnesis.desiredResult ? `Желаемый результат: ${client.anamnesis.desiredResult}` : ''}
Готовность: тело=${client.anamnesis.bodyReadiness}/10, ум=${client.anamnesis.mindReadiness}/10, сознание=${client.anamnesis.consciousnessReadiness}/10

ПОЗВОНОЧНИК:
${spineIssues || 'Без особенностей'}

ТЕСТЫ:
${neuroResults || 'Не проводились'}

ЦЕНТРЫ ТЯЖЕСТИ:
${gravityInfo}

РЕГИОНЫ ТЕЛА:
${bodyIssues || 'Без особенностей'}

МИОФАСЦИАЛЬНЫЕ ЦЕПИ:
${brokenChains || 'Все цепи в норме'}

ЗАМЕТКИ ТЕРАПЕВТА:
${visit.notes || 'Нет заметок'}

ПЛАН НА СЛЕДУЮЩИЙ ВИЗИТ:
${visit.nextPlan || 'Не указан'}
  `.trim()
}

async function requestAnalysis(prompt: string): Promise<string> {
  const settings = await getSettings()

  if (!settings.gigaChatApiKey) {
    return 'Для AI-анализа необходимо добавить ключ GigaChat в разделе Настройки.'
  }

  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        apiKey: settings.gigaChatApiKey,
        model: settings.gigaChatModel,
      }),
    })

    if (!response.ok) {
      throw new Error('Ошибка API')
    }

    const data = await response.json()
    return data.analysis
  } catch (error) {
    console.error('[v0] GigaChat API error:', error)
    return 'Не удалось выполнить анализ. Проверьте подключение к интернету и ключ GigaChat.'
  }
}

export async function analyzeVisit(visit: Visit, client: Client): Promise<string> {
  const prompt = `Вы — опытный остеопат-консультант. Проанализируйте все заполненные карточки пациента с фокусом на текущий приём.

${formatVisitForAnalysis(visit, client)}

Дайте структурированный отчёт:
1. Полное исследование по текущему приёму
2. Ключевые проблемы и взаимосвязи
3. Динамика относительно данных клиента, если она видна
4. Рекомендации и план дальнейшей работы

Отвечайте на русском языке, профессионально но понятно.`

  return requestAnalysis(prompt)
}

export async function analyzeClientHistory(client: Client): Promise<string> {
  if (client.visits.length === 0) {
    return 'Недостаточно данных для анализа истории.'
  }

  const visitsData = [...client.visits]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((visit, index) => `\n--- Визит ${index + 1} ---\n${formatVisitForAnalysis(visit, client)}`)
    .join('\n')

  const prompt = `Вы — опытный остеопат-консультант. Проанализируйте все заполненные карточки пациента, всю историю визитов и оцените динамику лечения.

ИСТОРИЯ ВИЗИТОВ:
${visitsData}

Дайте структурированный отчёт:
1. Полное исследование по истории приёмов
2. Общая динамика по датам
3. Ключевые проблемы и устойчивые паттерны
4. Что было успешно проработано
5. Что требует дальнейшего внимания
6. Рекомендации и стратегия дальнейшей работы

Отвечайте на русском языке, профессионально но понятно.`

  return requestAnalysis(prompt)
}
