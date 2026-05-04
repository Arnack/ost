"use client"

import { useState, useEffect, useMemo } from "react"
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  Calendar as CalendarIcon,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { storage } from "@/lib/storage"
import type { Payment, Client } from "@/lib/types"

const PAYMENT_METHODS = [
  { value: "cash", label: "Наличные", icon: Banknote },
  { value: "card", label: "Карта", icon: CreditCard },
  { value: "transfer", label: "Перевод", icon: Wallet },
]

const PAYMENT_STATUSES = [
  { value: "paid", label: "Оплачено", color: "bg-success text-success-foreground" },
  { value: "pending", label: "Ожидает", color: "bg-warning text-warning-foreground" },
  { value: "cancelled", label: "Отменён", color: "bg-destructive text-destructive-foreground" },
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    clientId: "",
    duration: "60",
    cost: "",
    paid: "",
    method: "cash" as Payment["method"],
    status: "paid" as Payment["status"],
    description: "",
    date: new Date(),
  })

  useEffect(() => {
    setPayments(storage.getPayments())
    setClients(storage.getClients())
  }, [])

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : "Неизвестный клиент"
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const client = clients.find((c) => c.id === payment.clientId)
      const clientName = client?.name?.toLowerCase() || ""
      const matchesSearch =
        clientName.includes(searchQuery.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter
      const matchesMethod =
        methodFilter === "all" || payment.method === methodFilter
      const paymentDate = parseISO(payment.date)
      const matchesDate = isWithinInterval(paymentDate, {
        start: dateRange.from,
        end: dateRange.to,
      })
      return matchesSearch && matchesStatus && matchesMethod && matchesDate
    })
  }, [payments, clients, searchQuery, statusFilter, methodFilter, dateRange])

  const stats = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + (p.paid ?? p.amount), 0)
    const debt = filteredPayments.reduce((sum, p) => sum + (p.debt ?? Math.max((p.cost ?? p.amount) - (p.paid ?? 0), 0)), 0)
    const cashTotal = filteredPayments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + (p.paid ?? p.amount), 0)
    const cardTotal = filteredPayments
      .filter((p) => p.method === "card")
      .reduce((sum, p) => sum + (p.paid ?? p.amount), 0)
    return { total, debt, cashTotal, cardTotal, count: filteredPayments.length }
  }, [filteredPayments])

  const handleSubmit = () => {
    if (!formData.clientId || !formData.cost) return

    const cost = parseFloat(formData.cost) || 0
    const paid = parseFloat(formData.paid) || 0
    const debt = Math.max(cost - paid, 0)

    const paymentData: Payment = {
      id: editingPayment?.id || crypto.randomUUID(),
      clientId: formData.clientId,
      amount: cost,
      duration: parseInt(formData.duration, 10) || undefined,
      cost,
      paid,
      debt,
      method: formData.method,
      status: debt <= 0 ? "paid" : formData.status,
      description: formData.description,
      date: formData.date.toISOString(),
      createdAt: editingPayment?.createdAt || new Date().toISOString(),
    }

    if (editingPayment) {
      storage.updatePayment(paymentData)
    } else {
      storage.addPayment(paymentData)
    }

    setPayments(storage.getPayments())
    resetForm()
    setIsAddDialogOpen(false)
    setEditingPayment(null)
  }

  const handleDelete = (id: string) => {
    storage.deletePayment(id)
    setPayments(storage.getPayments())
  }

  const resetForm = () => {
    setFormData({
      clientId: "",
      duration: "60",
      cost: "",
      paid: "",
      method: "cash",
      status: "paid",
      description: "",
      date: new Date(),
    })
  }

  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      clientId: payment.clientId,
      duration: payment.duration?.toString() || "60",
      cost: (payment.cost ?? payment.amount).toString(),
      paid: (payment.paid ?? payment.amount).toString(),
      method: payment.method,
      status: payment.status,
      description: payment.description || "",
      date: parseISO(payment.date),
    })
    setIsAddDialogOpen(true)
  }

  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const exportToCSV = () => {
    const headers = ["Дата", "Клиент", "Длительность", "Стоимость", "Оплачено", "Долг", "Способ", "Статус", "Описание"]
    const rows = filteredPayments.map((p) => [
      format(parseISO(p.date), "dd.MM.yyyy"),
      getClientName(p.clientId),
      (p.duration || "").toString(),
      (p.cost ?? p.amount).toString(),
      (p.paid ?? p.amount).toString(),
      (p.debt ?? 0).toString(),
      PAYMENT_METHODS.find((m) => m.value === p.method)?.label || p.method,
      PAYMENT_STATUSES.find((s) => s.value === p.status)?.label || p.status,
      p.description || "",
    ])
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments_${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Оплаты</h1>
          <p className="text-muted-foreground">
            Управление платежами и финансовой отчётностью
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportToCSV} className="min-h-[44px]">
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setEditingPayment(null)
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button className="min-h-[44px]">
                <Plus className="mr-2 h-4 w-4" />
                Добавить платёж
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPayment ? "Редактировать платёж" : "Новый платёж"}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>Клиент</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clientId: value })
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
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
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Длительность</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="60"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Стоимость</Label>
                    <Input
                      type="number"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({ ...formData, cost: e.target.value })
                      }
                      placeholder="0"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Оплачено</Label>
                    <Input
                      type="number"
                      value={formData.paid}
                      onChange={(e) =>
                        setFormData({ ...formData, paid: e.target.value })
                      }
                      placeholder="0"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  Долг: {formatCurrency(Math.max((parseFloat(formData.cost) || 0) - (parseFloat(formData.paid) || 0), 0))}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Способ оплаты</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value: Payment["method"]) =>
                      setFormData({ ...formData, method: value })
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center gap-2">
                            <method.icon className="h-4 w-4" />
                            {method.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Payment["status"]) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Дата</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-h-[44px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.date, "d MMMM yyyy", { locale: ru })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, date })
                        }
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Описание</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Комментарий к платежу"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingPayment(null)
                    resetForm()
                  }}
                  className="min-h-[44px]"
                >
                  Отмена
                </Button>
                <Button onClick={handleSubmit} className="min-h-[44px]">
                  {editingPayment ? "Сохранить" : "Добавить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Общий доход
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.count} оплаченных платежей
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Долг
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.debt)}</div>
            <p className="text-xs text-muted-foreground">
              Разница между стоимостью и оплатой
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Наличные
            </CardTitle>
            <Banknote className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.cashTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Оплата наличными
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Безналичные
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.cardTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Карты и переводы
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по клиенту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-h-[44px] w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="min-h-[44px] w-[150px]">
                <SelectValue placeholder="Способ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все способы</SelectItem>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-h-[44px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "dd.MM")} - {format(dateRange.to, "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                    }
                  }}
                  locale={ru}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Дата</TableHead>
                <TableHead className="min-w-[200px]">Клиент</TableHead>
                <TableHead className="min-w-[100px]">Длит.</TableHead>
                <TableHead className="min-w-[120px]">Стоимость</TableHead>
                <TableHead className="min-w-[120px]">Оплачено</TableHead>
                <TableHead className="min-w-[120px]">Долг</TableHead>
                <TableHead className="min-w-[120px]">Способ</TableHead>
                <TableHead className="min-w-[120px]">Статус</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Wallet className="h-8 w-8" />
                      <p>Платежи не найдены</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
                  const method = PAYMENT_METHODS.find(
                    (m) => m.value === payment.method
                  )
                  const status = PAYMENT_STATUSES.find(
                    (s) => s.value === payment.status
                  )
                  return (
                    <TableRow key={payment.id} className="min-h-[56px]">
                      <TableCell>
                        {format(parseISO(payment.date), "d MMM yyyy", {
                          locale: ru,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          {getClientName(payment.clientId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.duration ? `${payment.duration} мин` : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.cost ?? payment.amount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.paid ?? payment.amount)}
                      </TableCell>
                      <TableCell className={payment.debt ? "font-medium text-destructive" : "text-muted-foreground"}>
                        {formatCurrency(payment.debt ?? 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {method && <method.icon className="h-4 w-4 text-muted-foreground" />}
                          {method?.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status?.color}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(payment.status)}
                            {status?.label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.description || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(payment)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(payment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
