'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Clock, User, X, ChevronLeft, ChevronRight, CreditCard, FileText } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  parseISO,
  isToday,
  isAfter,
  startOfDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  getAppointments,
  saveAppointment,
  deleteAppointment,
  getClients,
  getSettings,
  saveClient,
  addPayment,
} from '@/lib/storage'
import type { Appointment, Client } from '@/lib/types'
import { createEmptyVisit } from '@/lib/types'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [defaultDuration, setDefaultDuration] = useState(60)
  const [defaultCost, setDefaultCost] = useState(5000)

  // Form state
  const [formClientId, setFormClientId] = useState<string>('')
  const [formClientName, setFormClientName] = useState('')
  const [formTime, setFormTime] = useState('10:00')
  const [formDuration, setFormDuration] = useState(60)
  const [formNotes, setFormNotes] = useState('')

  useEffect(() => {
    Promise.all([getAppointments(), getClients(), getSettings()]).then(([appointmentsData, clientsData, settings]) => {
      setAppointments(appointmentsData)
      setClients(clientsData)
      setDefaultDuration(settings.defaultSessionDuration || 60)
      setDefaultCost(settings.defaultSessionCost || 0)
    })
  }, [])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth, viewMode])

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return appointments
      .filter((a) => a.date === dateStr && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  // Open dialog for new appointment
  const openNewAppointmentDialog = (date: Date) => {
    setSelectedDate(date)
    setEditingAppointment(null)
    setFormClientId('')
    setFormClientName('')
    setFormTime('10:00')
    setFormDuration(defaultDuration)
    setFormNotes('')
    setIsDialogOpen(true)
  }

  // Open dialog for editing
  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setSelectedDate(parseISO(appointment.date))
    setFormClientId(appointment.clientId || '')
    setFormClientName(appointment.clientName || '')
    setFormTime(appointment.time)
    setFormDuration(appointment.duration)
    setFormNotes(appointment.notes || '')
    setIsDialogOpen(true)
  }

  // Save appointment
  const handleSaveAppointment = async () => {
    if (!selectedDate) return

    const client = clients.find((c) => c.id === formClientId)

    const appointment: Appointment = {
      id: editingAppointment?.id || crypto.randomUUID(),
      clientId: formClientId || undefined,
      clientName: client?.name || formClientName || 'Без имени',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: formTime,
      duration: formDuration,
      visitId: editingAppointment?.visitId,
      paymentId: editingAppointment?.paymentId,
      notes: formNotes || undefined,
      status: editingAppointment?.status || 'scheduled',
    }

    await saveAppointment(appointment)
    setAppointments(await getAppointments())
    setIsDialogOpen(false)
    toast.success(editingAppointment ? 'Запись обновлена' : 'Запись создана')
  }

  // Delete appointment
  const handleDeleteAppointment = async () => {
    if (!editingAppointment) return

    await deleteAppointment(editingAppointment.id)
    setAppointments(await getAppointments())
    setIsDialogOpen(false)
    toast.success('Запись удалена')
  }

  // Mark as completed
  const handleMarkCompleted = async (appointment: Appointment) => {
    const updated: Appointment = { ...appointment, status: 'completed' }
    await saveAppointment(updated)
    setAppointments(await getAppointments())
    toast.success('Запись отмечена как выполненная')
  }

  const handleCreateVisitFromAppointment = async (appointment: Appointment) => {
    if (!appointment.clientId) {
      toast.error('Выберите клиента для создания визита')
      return
    }

    const client = clients.find((item) => item.id === appointment.clientId)
    if (!client) {
      toast.error('Клиент не найден')
      return
    }

    if (appointment.visitId && client.visits.some((visit) => visit.id === appointment.visitId)) {
      toast.info('Визит уже создан')
      return
    }

    const visit = {
      ...createEmptyVisit(),
      date: new Date(`${appointment.date}T${appointment.time}`).toISOString(),
      notes: appointment.notes || '',
    }
    const updatedClient = {
      ...client,
      visits: [...client.visits, visit],
      lastVisit: visit.date,
    }
    const updatedAppointment: Appointment = {
      ...appointment,
      status: 'completed',
      visitId: visit.id,
    }

    await saveClient(updatedClient)
    await saveAppointment(updatedAppointment)
    setClients(await getClients())
    setAppointments(await getAppointments())
    setEditingAppointment(updatedAppointment)
    toast.success('Визит создан из записи')
  }

  const handleCreatePaymentFromAppointment = async (appointment: Appointment) => {
    if (!appointment.clientId) {
      toast.error('Выберите клиента для создания оплаты')
      return
    }
    if (appointment.paymentId) {
      toast.info('Оплата уже создана')
      return
    }

    const cost = defaultCost
    const payment = {
      id: crypto.randomUUID(),
      visitId: appointment.visitId,
      clientId: appointment.clientId,
      amount: cost,
      duration: appointment.duration,
      cost,
      paid: 0,
      debt: cost,
      method: 'cash' as const,
      status: 'pending' as const,
      description: `Приём ${format(parseISO(appointment.date), 'dd.MM.yyyy')} ${appointment.time}`,
      date: new Date(`${appointment.date}T${appointment.time}`).toISOString(),
      createdAt: new Date().toISOString(),
    }
    const updatedAppointment: Appointment = { ...appointment, paymentId: payment.id }

    await addPayment(payment)
    await saveAppointment(updatedAppointment)
    setAppointments(await getAppointments())
    setEditingAppointment(updatedAppointment)
    toast.success('Оплата создана')
  }

  const upcomingAppointments = useMemo(() => {
    const today = startOfDay(new Date())
    return appointments
      .filter((appointment) => {
        const date = parseISO(appointment.date)
        return appointment.status !== 'cancelled' && (isToday(date) || isAfter(date, today))
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 12)
  }, [appointments])

  return (
    <div className="flex flex-col h-full lg:flex-row">
      {/* Calendar */}
      <div className="flex-1 p-4 lg:p-6">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    viewMode === 'week'
                      ? subWeeks(currentMonth, 1)
                      : subMonths(currentMonth, 1)
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl min-w-[180px] text-center">
                {viewMode === 'week'
                  ? `${format(calendarDays[0], 'd MMM', { locale: ru })} — ${format(calendarDays[6], 'd MMM yyyy', { locale: ru })}`
                  : format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    viewMode === 'week'
                      ? addWeeks(currentMonth, 1)
                      : addMonths(currentMonth, 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border p-1">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Месяц
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Неделя
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
              >
                Сегодня
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => openNewAppointmentDialog(day)}
                    className={cn(
                      'relative min-h-[80px] p-1 rounded-lg border text-left transition-colors',
                      isCurrentMonth || viewMode === 'week'
                        ? 'bg-card hover:bg-accent'
                        : 'bg-muted/30 text-muted-foreground',
                      isSelected && 'ring-2 ring-primary',
                      isToday(day) && 'border-primary border-2'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        isToday(day) && 'text-primary'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(apt)
                          }}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded truncate cursor-pointer',
                            apt.status === 'completed'
                              ? 'bg-success/20 text-success'
                              : 'bg-primary/20 text-primary'
                          )}
                        >
                          {apt.time} {apt.clientName}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayAppointments.length - 2} ещё
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's appointments sidebar */}
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l p-4 lg:p-6 bg-card">
        <h2 className="text-lg font-semibold mb-4">Ближайшие записи</h2>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>Нет ближайших записей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent',
                    apt.status === 'completed' && 'opacity-60'
                  )}
                  onClick={() => openEditDialog(apt)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {format(parseISO(apt.date), 'd MMM', { locale: ru })} · {apt.time}
                    </span>
                    <Badge
                      variant={apt.status === 'completed' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {apt.duration} мин
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3" />
                    <span>{apt.clientName}</span>
                  </div>
                  {apt.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {apt.notes}
                    </p>
                  )}
                  {apt.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkCompleted(apt)
                      }}
                    >
                      Отметить выполненным
                    </Button>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {apt.clientId && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/clients/${apt.clientId}`}>
                          <User className="mr-1 h-3 w-3" />
                          Карта
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!apt.clientId || Boolean(apt.visitId)}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCreateVisitFromAppointment(apt)
                      }}
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      Визит
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!apt.clientId || Boolean(apt.paymentId)}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCreatePaymentFromAppointment(apt)
                      }}
                      className="col-span-2"
                    >
                      <CreditCard className="mr-1 h-3 w-3" />
                      Создать оплату
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Appointment dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Редактировать запись' : 'Новая запись'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Клиент</FieldLabel>
              <Select value={formClientId} onValueChange={setFormClientId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formClientId && (
                <Input
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  placeholder="Или введите имя нового клиента"
                  className="mt-2 h-11"
                />
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Время</FieldLabel>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel>Длительность (мин)</FieldLabel>
                <Input
                  type="number"
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  min={15}
                  step={15}
                  className="h-11"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Заметки</FieldLabel>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Дополнительная информация..."
                className="min-h-[80px]"
              />
            </Field>
          </FieldGroup>

          {editingAppointment && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
              {editingAppointment.clientId && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/clients/${editingAppointment.clientId}`}>
                    <User className="mr-2 h-4 w-4" />
                    Карта клиента
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!editingAppointment.clientId || Boolean(editingAppointment.visitId)}
                onClick={() => handleCreateVisitFromAppointment(editingAppointment)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Создать визит
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!editingAppointment.clientId || Boolean(editingAppointment.paymentId)}
                onClick={() => handleCreatePaymentFromAppointment(editingAppointment)}
                className="col-span-2"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Создать оплату
              </Button>
            </div>
          )}

          <DialogFooter className="gap-2">
            {editingAppointment && (
              <Button
                variant="destructive"
                onClick={handleDeleteAppointment}
              >
                <X className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveAppointment}>
              {editingAppointment ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
