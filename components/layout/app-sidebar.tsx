'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Calendar,
  BarChart3,
  CreditCard,
  Settings,
  Activity,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useTodayAppointmentsCount } from '@/hooks/use-appointments'

const navItems = [
  {
    title: 'Клиенты',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Календарь',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Аналитика',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Платежи',
    href: '/payments',
    icon: CreditCard,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const todayCount = useTodayAppointmentsCount()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-semibold text-foreground">OsteoTab</span>
            <span className="text-xs text-muted-foreground">CRM для остеопата</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      size="lg"
                      className="h-12"
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.title}</span>
                        {item.href === '/calendar' && todayCount > 0 && (
                          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {todayCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/settings'}
              tooltip="Настройки"
              size="lg"
              className="h-12"
            >
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span className="text-base">Настройки</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
