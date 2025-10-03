import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AuthGuard } from './auth/guards'

import SignInPage from '../features/auth/SignInPage'
import SignUpPage from '../features/auth/SignUpPage'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage'
import ResetPasswordPage from '../features/auth/ResetPasswordPage'
import AuthCallback from '../features/auth/AuthCallback'

import CustomersPage from '../features/app/customers/CustomersPage'
import ProductsPage from '../features/app/products/ProductsPage'
import ServicesPage from '../features/app/services/ServicesPage'
import TechniciansPage from '../features/app/technicians/TechniciansPage'
import SuppliersPage from '../features/app/suppliers/SuppliersPage'
import InventoryPage from '../features/app/inventory/InventoryPage'
import ProductDetailsPage from '../features/app/products/ProductDetailsPage'
import CompanySettingsPage from '../features/app/settings/CompanySettingsPage'
import BillingPage from '../features/app/settings/BillingPage'
import OrdersPage from '../features/app/serviceOrders/OrdersPage'
import OrderNewEditPage from '../features/app/serviceOrders/OrderNewEditPage'
import OrderDetailsPage from '../features/app/serviceOrders/OrderDetailsPage'
import DashboardPage from '../features/app/dashboard/DashboardPage'
import ReportsPage from '../features/app/reports/ReportsPage'
import EmployeesPage from '../features/app/employees/EmployeesPage'
import RemindersPage from '../features/app/reminders/RemindersPage'
import SalesPage from '../features/app/sales/SalesPage'

import CashPage from '../features/app/cash/CashPage'
import AppLayout from '../components/layout/AppLayout'
import AdminLayout from '../components/layout/AdminLayout'
import AdminDashboardPage from '../features/admin/Dashboard/AdminDashboardPage'
import AdminCompanyPage from '../features/admin/Company/AdminCompanyPage'
import AdminUsersPage from '../features/admin/Users/AdminUsersPage'


const router = createBrowserRouter([
    { path: '/auth/signin', element: <SignInPage /> },
    { path: '/auth/signup', element: <SignUpPage /> },
    { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
    { path: '/auth/reset-password', element: <ResetPasswordPage /> },
    { path: '/auth/callback', element: <AuthCallback /> },
    {
        path: '/',
        element: <AuthGuard />,
        children: [
            {
                path: '/app',
                element: <AppLayout />,
                children: [
                    { path: 'dashboard', element: <DashboardPage /> },
                    { path: 'customers', element: <CustomersPage /> },
                    { path: 'products', element: <ProductsPage /> },
                    { path: 'products/:sku', element: <ProductDetailsPage /> },
                    { path: 'services', element: <ServicesPage /> },
                    { path: 'technicians', element: <TechniciansPage /> },
                    { path: 'employees', element: <EmployeesPage /> },
                    { path: 'suppliers', element: <SuppliersPage /> },
                    { path: 'inventory', element: <InventoryPage /> },
                    { path: 'orders', element: <OrdersPage /> },
                    { path: 'orders/new', element: <OrderNewEditPage /> },
                    { path: 'orders/:id', element: <OrderDetailsPage /> },
                    { path: 'cash', element: <CashPage /> },
                    { path: 'reminders', element: <RemindersPage /> },
                    { path: 'sales', element: <SalesPage /> },
                    { path: 'reports/overview', element: <ReportsPage /> },
                    { path: 'settings/company', element: <CompanySettingsPage /> },
                    { path: 'settings/billing', element: <BillingPage /> },
                ],
            },
            {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                    { path: 'dashboard', element: <AdminDashboardPage /> },
                    { path: 'company', element: <AdminCompanyPage /> },
                    { path: 'users', element: <AdminUsersPage /> },
                ],
            },
        ],
    },
])

export function AppRouter() {
    return <RouterProvider router={router} />
}
