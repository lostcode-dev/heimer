import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { LayoutDashboard, ClipboardList, Boxes, Settings, ListChecks, CircleDollarSign } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "../common/AppSidebar";
import { SiteHeader } from "../common/SiteHeader";
import { useAuth } from "@/app/auth/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { apiCompanies, apiAuth, apiBilling } from "@/lib/api";

const AppRoutes = {
  Dashboard: "/app/dashboard",
  Customers: "/app/customers",
  Orders: "/app/orders",
  Products: "/app/products",
  Services: "/app/services",
  Suppliers: "/app/suppliers",
  Technicians: "/app/technicians",
  Employees: "/app/employees",
  Inventory: "/app/inventory",
  Cash: "/app/cash",
  Reports: "/app/reports",
  Settings: "/app/settings",
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const [companyName, setCompanyName] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");
  const [planLabel, setPlanLabel] = useState<string>("Studio");

  useEffect(() => {
    (async () => {
      try {
        const c = await apiCompanies.getMyCompany();
        if (c?.name) setCompanyName(c.name as string);
      } catch (_e) {
        // ignore, keep default; the guard will ensure user has a company
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const p = await apiAuth.getProfile();
        if (p?.full_name) setProfileName(p.full_name as string);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const o = await apiBilling.getOverview();
        // Map subscription status to a friendly label
        const status = (o.subscription?.status ?? '').toString();
        if (status === 'active' || status === 'trialing') setPlanLabel('Ativo');
        else if (status) setPlanLabel(status.charAt(0).toUpperCase() + status.slice(1));
        else setPlanLabel('Gratuito');
      } catch {
        // keep default
      }
    })();
  }, []);

  const displayNameRaw =
    profileName ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    (user?.email ? String(user.email).split("@")[0] : "Usuário");
  const displayName = useMemo(() => {
    const parts = String(displayNameRaw).trim().split(/\s+/).filter(Boolean)
    if (parts.length <= 2) return displayNameRaw
    // Prefer first + last for display
    return `${parts[0]} ${parts[parts.length - 1]}`
  }, [displayNameRaw])
  const email = user?.email ?? "";
  const avatar =
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

  const companyInitials = useMemo(() => {
    const parts = String(companyName).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || ''
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
    const letters = `${first}${last}`.toUpperCase()
    return letters || (displayName?.[0]?.toUpperCase() ?? "C");
  }, [companyName, displayName]);

  const CompanyLogo = ({ className }: { className?: string }) => (
    <span className={`inline-flex items-center justify-center ${className ?? ""}`}>{companyInitials}</span>
  );

  const sidebarData = {
    user: {
      name: displayName,
      email,
      avatar,
    },
    teams: [
      {
        name: companyName,
        logo: CompanyLogo,
        plan: planLabel,
      },
    ],
    navMain: [
      {
        title: 'Dashboard',
        url: AppRoutes.Dashboard,
        icon: LayoutDashboard,
      },
      {
        title: 'Operações',
        icon: ListChecks,
        items: [
          { title: 'Lembretes', url: '/app/reminders' },
          { title: 'Ordens de Serviço', url: AppRoutes.Orders },
          { title: 'Caixa', url: AppRoutes.Cash },
          { title: 'Estoque', url: AppRoutes.Inventory },
          { title: 'Vendas', url: '/app/sales' },
        ],
      },
      {
        title: 'Financeiro',
        icon: CircleDollarSign,
        items: [
          { title: 'Contas a Receber', url: '/app/finance/receivables' },
          { title: 'Contas a Pagar', url: '/app/finance/payables' },
          {
            title: 'Fiados', url: '/app/finance/fiados'
          },
        ],
      },
      {
        title: 'Cadastros',
        icon: Boxes,
        items: [
          { title: 'Clientes', url: AppRoutes.Customers },
          { title: 'Produtos', url: AppRoutes.Products },
          { title: 'Serviços', url: AppRoutes.Services },
          { title: 'Fornecedores', url: AppRoutes.Suppliers },
          { title: 'Técnicos', url: AppRoutes.Technicians },
          { title: 'Funcionários', url: AppRoutes.Employees },
        ],
      },
      {
        title: 'Relatórios',
        icon: ClipboardList,
        items: [
          { title: 'Vendas', url: '/app/reports/overview' },
          { title: 'Serviços', url: '/app/reports/overview' },
          { title: 'Caixa', url: '/app/reports/overview' },
          { title: 'Clientes', url: '/app/reports/overview' },
        ],
      },
      {
        title: 'Configurações',
        icon: Settings,
        items: [
          { title: 'Empresa', url: '/app/settings/company' },
          { title: 'Assinatura', url: '/app/settings/billing' },
        ],
      },
    ],
  };

  // Sort child items alphabetically by title to ensure consistent ordering in the sidebar
  const navMainSorted = sidebarData.navMain.map((item: any) => {
    if (Array.isArray(item.items)) {
      const sortedChildren = [...item.items].sort((a, b) =>
        (a?.title || '').localeCompare(b?.title || '', 'pt-BR', { sensitivity: 'base' })
      )
      return { ...item, items: sortedChildren }
    }
    return item
  })

  function findActiveTitle(items: any[]): string | undefined {
    for (const item of items) {
      // First, check children to prefer the deepest active title
      if (item.items) {
        const found = findActiveTitle(item.items)
        if (found) return found
      }
      if (item.isActive) return item.title
    }
    return undefined
  }

  // Compute a single, most-specific active link (longest matching URL)
  const flatEntries: Array<{ level: 'item' | 'sub'; i: number; j?: number; url: string }> = []
  navMainSorted.forEach((item: any, i: number) => {
    if (item.url && item.url !== '#') flatEntries.push({ level: 'item', i, url: item.url })
    if (Array.isArray(item.items)) {
      item.items.forEach((si: any, j: number) => {
        if (si.url) flatEntries.push({ level: 'sub', i, j, url: si.url })
      })
    }
  })
  const best = flatEntries
    .filter((e) => pathname.startsWith(e.url))
    .sort((a, b) => b.url.length - a.url.length)[0]

  // Mark only the best match as active; parents become expanded (not active)
  const itemsWithActive = navMainSorted.map((item: any, i: number) => {
    if (Array.isArray(item.items)) {
      const sub = item.items.map((si: any, j: number) => ({
        ...si,
        isActive: Boolean(best && best.level === 'sub' && best.i === i && best.j === j),
      }))
      const hasActiveSub = sub.some((si: any) => si.isActive)
      const itemActive = Boolean(best && best.level === 'item' && best.i === i)
      return { ...item, items: sub, isActive: itemActive, expanded: hasActiveSub || itemActive }
    }
    return { ...item, isActive: Boolean(best && best.level === 'item' && best.i === i) }
  })

  const activeItem = findActiveTitle(itemsWithActive) || 'Dashboard';

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" data={{ ...sidebarData, navMain: itemsWithActive }} />
      <SidebarInset>
        <SiteHeader activeTitle={activeItem} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
