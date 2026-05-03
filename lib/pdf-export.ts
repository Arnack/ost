// PDF Export functionality for OsteoTab
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import type { Client, Visit } from './types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

// Custom AutoTable type for jsPDF
interface AutoTableJsPDF extends jsPDF {
  autoTable: (options: {
    head?: (string[])[]
    body?: (string | number)[][]
    startY?: number
    theme?: string
    styles?: Record<string, unknown>
    headStyles?: Record<string, unknown>
  }) => void
  lastAutoTable?: { finalY: number }
}

export function exportClientToPDF(client: Client): void {
  const doc = new jsPDF() as AutoTableJsPDF
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Title
  doc.setFontSize(20)
  doc.text('Карточка клиента', pageWidth / 2, 20, { align: 'center' })
  
  // Client info
  doc.setFontSize(14)
  doc.text(client.name, 14, 35)
  
  doc.setFontSize(10)
  let yPos = 45
  
  if (client.phone) {
    doc.text(`Телефон: ${client.phone}`, 14, yPos)
    yPos += 7
  }
  if (client.email) {
    doc.text(`Email: ${client.email}`, 14, yPos)
    yPos += 7
  }
  if (client.birthDate) {
    doc.text(`Дата рождения: ${format(new Date(client.birthDate), 'dd.MM.yyyy')}`, 14, yPos)
    yPos += 7
  }
  
  doc.text(`Первый визит: ${format(new Date(client.firstVisit), 'dd.MM.yyyy', { locale: ru })}`, 14, yPos)
  yPos += 7
  doc.text(`Последний визит: ${format(new Date(client.lastVisit), 'dd.MM.yyyy', { locale: ru })}`, 14, yPos)
  yPos += 7
  doc.text(`Всего визитов: ${client.visits.length}`, 14, yPos)
  yPos += 15
  
  // Anamnesis section
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(12)
  doc.text('Анамнез', 14, yPos)
  yPos += 10
  
  doc.setFontSize(10)
  const anamnesis = client.anamnesis
  const anamnesisFields = [
    { label: 'Симптомы', value: anamnesis.symptoms },
    { label: 'Жалобы', value: anamnesis.complaints },
    { label: 'Травмы', value: anamnesis.injuries },
    { label: 'Шрамы', value: anamnesis.scars },
    { label: 'Препараты', value: anamnesis.medications },
    { label: 'Родовые травмы', value: anamnesis.birthTraumas },
    { label: 'Диагноз', value: anamnesis.diagnosis },
  ]
  
  for (const field of anamnesisFields) {
    if (field.value) {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.text(`${field.label}:`, 14, yPos)
      doc.setFont('helvetica', 'normal')
      const splitText = doc.splitTextToSize(field.value, pageWidth - 28)
      doc.text(splitText, 14, yPos + 5)
      yPos += 10 + (splitText.length * 4)
    }
  }
  
  // Visits section
  if (client.visits.length > 0) {
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.text('История визитов', 14, yPos)
    yPos += 10
    
    const visitsData = client.visits.map((visit: Visit, index: number) => [
      `#${index + 1}`,
      format(new Date(visit.date), 'dd.MM.yyyy', { locale: ru }),
      visit.notes ? (visit.notes.length > 50 ? visit.notes.substring(0, 50) + '...' : visit.notes) : '-',
      visit.nextPlan ? (visit.nextPlan.length > 30 ? visit.nextPlan.substring(0, 30) + '...' : visit.nextPlan) : '-',
    ])
    
    doc.autoTable({
      head: [['№', 'Дата', 'Заметки', 'План']],
      body: visitsData,
      startY: yPos,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [26, 107, 114] },
    })
  }
  
  // Save PDF
  const fileName = `client_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export function exportAllClientsToPDF(clients: Client[]): void {
  const doc = new jsPDF() as AutoTableJsPDF
  
  doc.setFontSize(16)
  doc.text('Список клиентов', 14, 20)
  
  const clientsData = clients.map((client, index) => [
    index + 1,
    client.name,
    client.phone || '-',
    format(new Date(client.firstVisit), 'dd.MM.yyyy', { locale: ru }),
    format(new Date(client.lastVisit), 'dd.MM.yyyy', { locale: ru }),
    client.visits.length,
  ])
  
  doc.autoTable({
    head: [['№', 'Имя', 'Телефон', 'Первый визит', 'Последний визит', 'Визитов']],
    body: clientsData,
    startY: 30,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [26, 107, 114] },
  })
  
  const fileName = `clients_list_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
