import { Outlet, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '../common/AppSidebar'
import { SiteHeader } from '../common/SiteHeader'
import { LayoutDashboard, Building2, Users } from 'lucide-react'

const AdminRoutes = {
  Dashboard: '/admin/dashboard',
  Company: '/admin/company',
  Users: '/admin/users',
}

export default function AdminLayout() {
  const { pathname } = useLocation()

  const sidebarData = {
    user: {
      name: 'Admin',
      email: 'admin@example.com',
      avatar: 'https://ui-avatars.com/api/?name=Admin',
    },
    teams: [
      {
        name: 'Admin',
        logo: LayoutDashboard,
        plan: 'Control',
      },
    ],
    navMain: [
      { title: 'Dashboard', url: AdminRoutes.Dashboard, icon: LayoutDashboard },
      { title: 'Empresa', url: AdminRoutes.Company, icon: Building2 },
      { title: 'Usuários', url: AdminRoutes.Users, icon: Users },
    ],
  }

  function findActiveTitle(items: Array<{ title: string; url: string; isActive?: boolean }>): string | undefined {
    for (const item of items) {
      if (item.isActive) return item.title
    }
    return undefined
  }

  const itemsWithActive = sidebarData.navMain.map((item) => ({
    ...item,
    isActive: pathname.startsWith(item.url),
  }))

  const activeItem = findActiveTitle(itemsWithActive as Array<{ title: string; url: string; isActive?: boolean }>) || 'Dashboard'

  return (
    <SidebarProvider
      style={{
        ['--sidebar-width' as any]: 'calc(var(--spacing) * 72)',
        ['--header-height' as any]: 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant="inset" data={{ ...sidebarData, navMain: itemsWithActive }} />
      <SidebarInset>
        <SiteHeader activeTitle={activeItem} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
