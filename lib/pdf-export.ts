// PDF Export functionality for OsteoTab
import type { Client, Visit } from './types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getPayments } from './storage'

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd.MM.yyyy', { locale: ru })
}

function renderTextBlock(label: string, value: string | undefined): string {
  if (!value) return ''
  return `<div class="text-block"><strong>${escapeHtml(label)}:</strong><p>${escapeHtml(value)}</p></div>`
}

function openPrintDocument(title: string, body: string): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('Не удалось открыть окно печати. Разрешите всплывающие окна для экспорта PDF.')
  }

  printWindow.document.write(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #172326;
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 12px;
      line-height: 1.45;
    }
    h1, h2, h3 { margin: 0 0 8px; color: #123f44; }
    h1 { font-size: 24px; text-align: center; margin-bottom: 18px; }
    h2 { font-size: 17px; margin-top: 20px; border-bottom: 1px solid #d7e4e6; padding-bottom: 5px; }
    h3 { font-size: 14px; margin-top: 14px; }
    p { margin: 4px 0 0; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td { border: 1px solid #d7e4e6; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #1a6b72; color: white; font-weight: 700; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; margin-bottom: 12px; }
    .text-block { margin: 8px 0; page-break-inside: avoid; }
    .muted { color: #667a80; }
    .print-note { margin-top: 24px; font-size: 10px; color: #667a80; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  ${body}
  <script>
    window.addEventListener('load', () => {
      window.focus()
      window.print()
    })
  </script>
</body>
</html>`)
  printWindow.document.close()
}

export async function exportClientToPDF(client: Client): Promise<void> {
  const anamnesis = client.anamnesis
  const anamnesisFields = [
    { label: 'Симптомы', value: anamnesis.symptoms },
    { label: 'Первые симптомы', value: anamnesis.firstSymptoms },
    { label: 'Жалобы', value: anamnesis.complaints },
    { label: 'Травмы', value: anamnesis.injuries },
    { label: 'Шрамы', value: anamnesis.scars },
    { label: 'Препараты', value: anamnesis.medications },
    { label: 'Родовые травмы', value: anamnesis.birthTraumas },
    { label: 'Положение сна', value: anamnesis.sleepPositions },
    { label: 'Специалисты', value: anamnesis.specialists },
    { label: 'Лечение', value: anamnesis.treatment },
    { label: 'Результат лечения', value: anamnesis.treatmentResult },
    { label: 'Диагноз', value: anamnesis.diagnosis },
    { label: 'Дополнительно', value: anamnesis.additionalInfo },
    { label: 'Желаемый результат', value: anamnesis.desiredResult },
  ]
  const visitsRows = client.visits.map((visit: Visit, index: number) => `
    <tr>
      <td>${index + 1}</td>
      <td>${formatDate(visit.date)}</td>
      <td>${escapeHtml(visit.notes || '-')}</td>
      <td>${escapeHtml(visit.nextPlan || '-')}</td>
    </tr>`).join('')
  const latestVisit = client.visits[client.visits.length - 1]
  const clientPayments = [
    ...client.payments,
    ...(await getPayments()).filter((payment) => payment.clientId === client.id && !client.payments.some((item) => item.id === payment.id)),
  ]
  const paymentsRows = clientPayments.map((payment, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${formatDate(payment.date)}</td>
      <td>${escapeHtml(payment.cost ?? payment.amount)}</td>
      <td>${escapeHtml(payment.paid ?? payment.amount)}</td>
      <td>${escapeHtml(payment.debt ?? 0)}</td>
      <td>${escapeHtml(payment.status)}</td>
    </tr>`).join('')

  openPrintDocument(`Карточка клиента - ${client.name}`, `
    <h1>Карточка клиента</h1>
    <h2>${escapeHtml(client.name)}</h2>
    <div class="meta">
      <div><strong>Телефон:</strong> ${escapeHtml(client.phone || '-')}</div>
      <div><strong>Email:</strong> ${escapeHtml(client.email || '-')}</div>
      <div><strong>Дата рождения:</strong> ${client.birthDate ? formatDate(client.birthDate) : '-'}</div>
      <div><strong>Первый визит:</strong> ${formatDate(client.firstVisit)}</div>
      <div><strong>Последний визит:</strong> ${formatDate(client.lastVisit)}</div>
      <div><strong>Всего визитов:</strong> ${client.visits.length}</div>
    </div>

    <h2>Анамнез</h2>
    ${anamnesisFields.map((field) => renderTextBlock(field.label, field.value)).join('') || '<p class="muted">Нет данных</p>'}

    <h2>История визитов</h2>
    ${visitsRows ? `<table><thead><tr><th>№</th><th>Дата</th><th>Что обсуждали / чем работали</th><th>Договорились на следующий раз</th></tr></thead><tbody>${visitsRows}</tbody></table>` : '<p class="muted">Нет визитов</p>'}

    ${latestVisit ? `<h2>Сводка последнего визита</h2>
      <div class="meta">
        <div><strong>Позвоночник:</strong> ${latestVisit.spineData.segments.filter((segment) => segment.status !== 'normal').length}</div>
        <div><strong>Нейротесты:</strong> ${latestVisit.neuroTests.length}</div>
        <div><strong>Регионы тела:</strong> ${latestVisit.bodyRegions.regions.filter((region) => region.status !== 'neutral').length}</div>
        <div><strong>Мышечные цепи:</strong> ${latestVisit.muscleChains.chains.filter((chain) => chain.status === 'break').length}</div>
        <div><strong>Вес Л/П:</strong> ${escapeHtml(`${latestVisit.gravityData.weightLeft}/${latestVisit.gravityData.weightRight}`)}</div>
      </div>
      ${renderTextBlock('AI-анализ', latestVisit.aiSummary)}` : ''}

    <h2>Оплаты</h2>
    ${paymentsRows ? `<table><thead><tr><th>№</th><th>Дата</th><th>План</th><th>Оплачено</th><th>Долг</th><th>Статус</th></tr></thead><tbody>${paymentsRows}</tbody></table>` : '<p class="muted">Нет оплат</p>'}
    <p class="print-note">В окне печати выберите «Сохранить как PDF».</p>
  `)
}

export function exportAllClientsToPDF(clients: Client[]): void {
  const clientsRows = clients.map((client, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(client.name)}</td>
      <td>${escapeHtml(client.phone || '-')}</td>
      <td>${formatDate(client.firstVisit)}</td>
      <td>${formatDate(client.lastVisit)}</td>
      <td>${client.visits.length}</td>
    </tr>`).join('')

  openPrintDocument('Список клиентов', `
    <h1>Список клиентов</h1>
    ${clientsRows ? `<table><thead><tr><th>№</th><th>Имя</th><th>Телефон</th><th>Первый визит</th><th>Последний визит</th><th>Визитов</th></tr></thead><tbody>${clientsRows}</tbody></table>` : '<p class="muted">Нет клиентов</p>'}
    <p class="print-note">В окне печати выберите «Сохранить как PDF».</p>
  `)
}
