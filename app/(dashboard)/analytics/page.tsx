"use client"

import { useState, useEffect, useMemo } from "react"
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  parseISO,
  differenceInYears,
  isWithinInterval,
} from "date-fns"
import { ru } from "date-fns/locale"
import {
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  UserPlus,
  Repeat,
  PieChart as PieChartIcon,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { storage } from "@/lib/storage"
import type { Client, Appointment, Payment } from "@/lib/types"

// Compute colors from CSS vars at runtime
const CHART_COLORS = {
  primary: "#1A6B72",
  secondary: "#2A8B92",
  accent: "#3AABA2",
  muted: "#5ACBBB",
  light: "#7AEBD5",
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.muted,
  CHART_COLORS.light,
]

type TimeRange = "3m" | "6m" | "12m"

export default function AnalyticsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>("6m")

  useEffect(() => {
    setClients(storage.getClients())
    setAppointments(storage.getAppointments())
    setPayments(storage.getPayments())
  }, [])

  const dateRange = useMemo(() => {
    const now = new Date()
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12
    return {
      start: startOfMonth(subMonths(now, months - 1)),
      end: endOfMonth(now),
    }
  }, [timeRange])

  // Monthly stats
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    })

    return months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const monthClients = clients.filter((c) => {
        const created = parseISO(c.createdAt || c.firstVisit)
        return isWithinInterval(created, { start: monthStart, end: monthEnd })
      })

      const monthAppointments = appointments.filter((a) => {
        const date = parseISO(a.date)
        return isWithinInterval(date, { start: monthStart, end: monthEnd })
      })

      const completedAppointments = monthAppointments.filter(
        (a) => a.status === "completed"
      )

      const monthPayments = payments.filter((p) => {
        const date = parseISO(p.date)
        return (
          isWithinInterval(date, { start: monthStart, end: monthEnd }) &&
          p.status === "paid"
        )
      })

      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0)

      return {
        month: format(month, "MMM", { locale: ru }),
        fullMonth: format(month, "LLLL yyyy", { locale: ru }),
        newClients: monthClients.length,
        appointments: monthAppointments.length,
        completed: completedAppointments.length,
        revenue: revenue,
      }
    })
  }, [clients, appointments, payments, dateRange])

  // Overall stats
  const stats = useMemo(() => {
    const totalClients = clients.length
    const activeClients = clients.filter((c) => c.status === "active").length

    const rangeAppointments = appointments.filter((a) => {
      const date = parseISO(a.date)
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end })
    })

    const completedAppointments = rangeAppointments.filter(
      (a) => a.status === "completed"
    )

    const rangePayments = payments.filter((p) => {
      const date = parseISO(p.date)
      return (
        isWithinInterval(date, { start: dateRange.start, end: dateRange.end }) &&
        p.status === "paid"
      )
    })

    const totalRevenue = rangePayments.reduce((sum, p) => sum + p.amount, 0)
    const avgVisitPrice =
      completedAppointments.length > 0
        ? totalRevenue / completedAppointments.length
        : 0

    // Calculate returning clients
    const clientVisitCounts = appointments.reduce(
      (acc, a) => {
        if (a.status === "completed") {
          acc[a.clientId] = (acc[a.clientId] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>
    )

    const returningClients = Object.values(clientVisitCounts).filter(
      (count) => count > 1
    ).length

    const retentionRate =
      Object.keys(clientVisitCounts).length > 0
        ? (returningClients / Object.keys(clientVisitCounts).length) * 100
        : 0

    return {
      totalClients,
      activeClients,
      totalAppointments: rangeAppointments.length,
      completedAppointments: completedAppointments.length,
      totalRevenue,
      avgVisitPrice,
      returningClients,
      retentionRate,
    }
  }, [clients, appointments, payments, dateRange])

  // Age distribution
  const ageDistribution = useMemo(() => {
    const distribution = {
      "0-18": 0,
      "19-35": 0,
      "36-50": 0,
      "51-65": 0,
      "65+": 0,
    }

    clients.forEach((client) => {
      if (client.birthDate) {
        const age = differenceInYears(new Date(), parseISO(client.birthDate))
        if (age <= 18) distribution["0-18"]++
        else if (age <= 35) distribution["19-35"]++
        else if (age <= 50) distribution["36-50"]++
        else if (age <= 65) distribution["51-65"]++
        else distribution["65+"]++
      }
    })

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }))
  }, [clients])

  // Gender distribution
  const genderDistribution = useMemo(() => {
    const male = clients.filter((c) => c.gender === "male").length
    const female = clients.filter((c) => c.gender === "female").length
    const unknown = clients.length - male - female
    const result = []
    if (male > 0) result.push({ name: "Мужчины", value: male })
    if (female > 0) result.push({ name: "Женщины", value: female })
    if (unknown > 0 || result.length === 0) result.push({ name: "Не указан", value: unknown })
    return result
  }, [clients])

  // Pain regions distribution
  const painRegions = useMemo(() => {
    const regions: Record<string, number> = {}

    clients.forEach((client) => {
      if (client.bodyRegions) {
        Object.entries(client.bodyRegions).forEach(([region, data]) => {
          if (data && typeof data === 'object' && 'painLevel' in data && (data as { painLevel: number }).painLevel > 0) {
            const regionName = getRegionName(region)
            regions[regionName] = (regions[regionName] || 0) + 1
          }
        })
      }
    })

    const result = Object.entries(regions)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Return default data if no pain regions found
    if (result.length === 0) {
      return [{ name: "Нет данных", value: 0 }]
    }
    return result
  }, [clients])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Аналитика</h1>
          <p className="text-muted-foreground">
            Статистика и отчёты по работе кабинета
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(v: TimeRange) => setTimeRange(v)}
        >
          <SelectTrigger className="min-h-[44px] w-[180px]">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Последние 3 месяца</SelectItem>
            <SelectItem value="6m">Последние 6 месяцев</SelectItem>
            <SelectItem value="12m">Последний год</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего клиентов
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeClients} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Приёмов проведено
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAppointments}</div>
            <p className="text-xs text-muted-foreground">
              из {stats.totalAppointments} запланированных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Доход за период
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Средний чек: {formatCurrency(stats.avgVisitPrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Удержание клиентов
            </CardTitle>
            <Repeat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.retentionRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.returningClients} повторных клиентов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Динамика дохода</CardTitle>
            <CardDescription>Доход по месяцам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Доход",
                  color: CHART_COLORS.primary,
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Appointments Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Приёмы и новые клиенты</CardTitle>
            <CardDescription>Динамика по месяцам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: {
                  label: "Проведено приёмов",
                  color: CHART_COLORS.primary,
                },
                newClients: {
                  label: "Новых клиентов",
                  color: CHART_COLORS.accent,
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.primary }}
                    name="Проведено приёмов"
                  />
                  <Line
                    type="monotone"
                    dataKey="newClients"
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.accent }}
                    name="Новых клиентов"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Возраст клиентов</CardTitle>
            <CardDescription>Распределение по возрастным группам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Клиентов",
                  color: CHART_COLORS.primary,
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {ageDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Пол клиентов</CardTitle>
            <CardDescription>Соотношение мужчин и женщин</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Клиентов",
                  color: CHART_COLORS.primary,
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    <Cell fill={CHART_COLORS.primary} />
                    <Cell fill={CHART_COLORS.accent} />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pain Regions */}
        <Card>
          <CardHeader>
            <CardTitle>Частые зоны боли</CardTitle>
            <CardDescription>Топ-5 областей с жалобами</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Клиентов",
                  color: CHART_COLORS.primary,
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={painRegions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill={CHART_COLORS.primary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Сводка за период</CardTitle>
          <CardDescription>
            {format(dateRange.start, "d MMMM yyyy", { locale: ru })} -{" "}
            {format(dateRange.end, "d MMMM yyyy", { locale: ru })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Новых клиентов</span>
              <span className="text-xl font-semibold">
                {monthlyData.reduce((sum, m) => sum + m.newClients, 0)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Всего приёмов</span>
              <span className="text-xl font-semibold">
                {monthlyData.reduce((sum, m) => sum + m.appointments, 0)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Проведено</span>
              <span className="text-xl font-semibold">
                {monthlyData.reduce((sum, m) => sum + m.completed, 0)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Общий доход</span>
              <span className="text-xl font-semibold">
                {formatCurrency(
                  monthlyData.reduce((sum, m) => sum + m.revenue, 0)
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Средний доход/мес</span>
              <span className="text-xl font-semibold">
                {formatCurrency(
                  monthlyData.reduce((sum, m) => sum + m.revenue, 0) /
                    monthlyData.length
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                Приёмов в месяц
              </span>
              <span className="text-xl font-semibold">
                {(
                  monthlyData.reduce((sum, m) => sum + m.completed, 0) /
                  monthlyData.length
                ).toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getRegionName(region: string): string {
  const names: Record<string, string> = {
    head: "Голова",
    neck: "Шея",
    shoulderLeft: "Левое плечо",
    shoulderRight: "Правое плечо",
    upperBack: "Верх спины",
    middleBack: "Середина спины",
    lowerBack: "Поясница",
    chest: "Грудь",
    abdomen: "Живот",
    hipLeft: "Левое бедро",
    hipRight: "Правое бедро",
    kneeLeft: "Левое колено",
    kneeRight: "Правое колено",
    ankleLeft: "Левая лодыжка",
    ankleRight: "Правая лодыжка",
    elbowLeft: "Левый локоть",
    elbowRight: "Правый локоть",
    wristLeft: "Левое запястье",
    wristRight: "Правое запястье",
  }
  return names[region] || region
}
