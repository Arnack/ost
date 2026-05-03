// Claude API client for AI analysis

import type { Client, Visit } from './types'
import { getSettings } from './storage'

export interface AnalysisResult {
  summary: string
  recommendations: string[]
  concerns: string[]
}

// Format visit data for AI analysis
function formatVisitForAnalysis(visit: Visit, client: Client): string {
  const spineIssues = visit.spineData.segments
    .filter((s) => s.status !== 'normal')
    .map((s) => `${s.name}: ${s.status}`)
    .join(', ')

  const neuroResults = visit.neuroTests
    .map((t) => `${t.name}: до=${t.results.current || '—'}, после=${t.results.postSession || '—'}`)
    .join('; ')

  const bodyIssues = visit.bodyRegions.regions
    .filter((r) => r.status !== 'neutral')
    .map((r) => `${r.name} (${r.status})`)
    .join(', ')

  const brokenChains = visit.muscleChains.chains
    .filter((c) => c.status === 'break')
    .map((c) => c.name)
    .join(', ')

  const gravityInfo = `
    Передне-задний: верх=${visit.gravityData.anteriorPosterior.upper}, низ=${visit.gravityData.anteriorPosterior.lower}
    Лево-правый: верх=${visit.gravityData.leftRight.upper}, низ=${visit.gravityData.leftRight.lower}
    Вес: лев=${visit.gravityData.weightLeft}кг, прав=${visit.gravityData.weightRight}кг
  `

  return `
ДАННЫЕ ВИЗИТА:
Дата: ${visit.date}
Клиент: ${client.name}

АНАМНЕЗ:
${client.anamnesis.symptoms ? `Симптомы: ${client.anamnesis.symptoms}` : ''}
${client.anamnesis.complaints ? `Жалобы: ${client.anamnesis.complaints}` : ''}
${client.anamnesis.injuries ? `Травмы: ${client.anamnesis.injuries}` : ''}
Готовность: тело=${client.anamnesis.bodyReadiness}/10, ум=${client.anamnesis.mindReadiness}/10, сознание=${client.anamnesis.consciousnessReadiness}/10

ПОЗВОНОЧНИК:
${spineIssues || 'Без особенностей'}

НЕВРОЛОГИЧЕСКИЕ ТЕСТЫ:
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

// Analyze single visit with Claude
export async function analyzeVisit(visit: Visit, client: Client): Promise<string> {
  const settings = getSettings()
  
  if (!settings.claudeApiKey) {
    return 'Для AI-анализа необходимо добавить API ключ Claude в разделе Настройки.'
  }

  const prompt = `Вы — опытный остеопат-консультант. Проанализируйте данные визита пациента и дайте краткое заключение.

${formatVisitForAnalysis(visit, client)}

Дайте краткий анализ (3-5 предложений) с акцентом на:
1. Основные находки
2. Взаимосвязь между нарушениями
3. Рекомендации для дальнейшей работы

Отвечайте на русском языке, профессионально но понятно.`

  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        apiKey: settings.claudeApiKey,
      }),
    })

    if (!response.ok) {
      throw new Error('Ошибка API')
    }

    const data = await response.json()
    return data.analysis
  } catch (error) {
    console.error('[v0] Claude API error:', error)
    return 'Не удалось выполнить анализ. Проверьте подключение к интернету и API ключ.'
  }
}

// Analyze full client history
export async function analyzeClientHistory(client: Client): Promise<string> {
  const settings = getSettings()
  
  if (!settings.claudeApiKey) {
    return 'Для AI-анализа необходимо добавить API ключ Claude в разделе Настройки.'
  }

  if (client.visits.length === 0) {
    return 'Недостаточно данных для анализа истории.'
  }

  const visitsData = client.visits
    .slice(-10) // Last 10 visits
    .map((v, i) => `\n--- Визит ${i + 1} ---\n${formatVisitForAnalysis(v, client)}`)
    .join('\n')

  const prompt = `Вы — опытный остеопат-консультант. Проанализируйте историю визитов пациента и оцените динамику лечения.

ИСТОРИЯ ВИЗИТОВ:
${visitsData}

Дайте анализ прогресса пациента:
1. Общая динамика (улучшение/ухудшение/стабильно)
2. Какие проблемы были успешно проработаны
3. Какие проблемы требуют дальнейшего внимания
4. Рекомендации по стратегии лечения

Отвечайте на русском языке, профессионально но понятно.`

  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        apiKey: settings.claudeApiKey,
      }),
    })

    if (!response.ok) {
      throw new Error('Ошибка API')
    }

    const data = await response.json()
    return data.analysis
  } catch (error) {
    console.error('[v0] Claude API error:', error)
    return 'Не удалось выполнить анализ. Проверьте подключение к интернету и API ключ.'
  }
}
