'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileDown } from 'lucide-react'
import { differenceInYears, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent, EmptyHeader } from '@/components/ui/empty'
import { getClientsSortedByLastVisit, saveClient } from '@/lib/storage'
import { createEmptyClient, type Client } from '@/lib/types'
import { exportAllClientsToPDF } from '@/lib/pdf-export'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')

  // Load clients on mount
  useEffect(() => {
    setClients(getClientsSortedByLastVisit())
  }, [])

  // Filter clients by search
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [clients, search])

  const getAge = (birthDate?: string) => {
    if (!birthDate) return '—'
    return differenceInYears(new Date(), parseISO(birthDate)).toString()
  }

  // Create new client
  const handleCreateClient = () => {
    if (!newClientName.trim()) return

    const client = createEmptyClient(newClientName.trim())
    saveClient(client)
    setClients(getClientsSortedByLastVisit())
    setNewClientName('')
    setIsNewClientOpen(false)
    router.push(`/clients/${client.id}`)
  }

  // Navigate to client card
  const handleClientClick = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b bg-card p-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Клиенты</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? 'клиент' : clients.length < 5 ? 'клиента' : 'клиентов'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {clients.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportAllClientsToPDF(clients)}
              className="h-12 px-4 text-base"
            >
              <FileDown className="mr-2 h-5 w-5" />
              PDF
            </Button>
          )}
          <Button
            onClick={() => setIsNewClientOpen(true)}
            className="h-12 px-6 text-base"
          >
            <Plus className="mr-2 h-5 w-5" />
            Новый клиент
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b bg-card px-4 py-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, телефону или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-auto p-4">
        {filteredClients.length === 0 ? (
          <Empty className="border rounded-lg min-h-[300px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>
                {clients.length === 0 ? 'Нет клиентов' : 'Клиенты не найдены'}
              </EmptyTitle>
              <EmptyDescription>
                {clients.length === 0
                  ? 'Создайте первого клиента, чтобы начать работу'
                  : 'Попробуйте изменить параметры поиска'}
              </EmptyDescription>
            </EmptyHeader>
            {clients.length === 0 && (
              <EmptyContent>
                <Button onClick={() => setIsNewClientOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать клиента
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[30%]">ФИО</TableHead>
                  <TableHead>Возраст</TableHead>
                  <TableHead>Первый приём</TableHead>
                  <TableHead>Последний визит</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="h-14"
                  >
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getAge(client.birthDate)}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {format(parseISO(client.firstVisit), 'd MMM yyyy', {
                            locale: ru,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {format(parseISO(client.lastVisit), 'd MMM yyyy', {
                              locale: ru,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClientClick(client.id)}
                        >
                          Открыть
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* New client dialog */}
      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый клиент</DialogTitle>
            <DialogDescription>
              Введите имя клиента для создания карточки
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="client-name">ФИО клиента</FieldLabel>
              <Input
                id="client-name"
                placeholder="Иванов Иван Иванович"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateClient()
                }}
                className="h-11"
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewClientOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={!newClientName.trim()}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
