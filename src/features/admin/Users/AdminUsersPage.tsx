import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CustomTable } from '@/components/custom/Table/CustomTable'
import type { IColumns, IPagination } from '@/types'
import { apiAdminUsers } from '@/lib/api'

export default function AdminUsersPage() {
  const [pagination, setPagination] = useState<IPagination>({
    sortField: 'created_at', sortOrder: 'DESC', search: '', currentPage: 1, itemsPerPage: 10,
    currentTotalItems: 0, totalItems: 0, totalPages: 1,
  })
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const { data, count } = await apiAdminUsers.listPaginated({
        page: pagination.currentPage - 1,
        pageSize: pagination.itemsPerPage,
        query: pagination.search,
        sortBy: pagination.sortField,
        sortDir: pagination.sortOrder === 'ASC' ? 'asc' : 'desc',
      })
      setRows(data)
      setPagination((p) => ({ ...p, currentTotalItems: data.length, totalItems: count, totalPages: Math.max(1, Math.ceil(count / p.itemsPerPage)) }))
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao carregar usuários') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [pagination.currentPage, pagination.itemsPerPage, pagination.search, pagination.sortField, pagination.sortOrder])

  const columns: IColumns<any>[] = [
    { label: 'Nome', field: 'full_name', sortable: true },
    { label: 'E-mail', field: 'email', sortable: true, format: (v) => v ?? '-' },
    { label: 'Criado em', field: 'created_at', sortable: true, format: (v) => new Date(v).toLocaleString('pt-BR') },
  ]

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <CustomTable
          data={rows}
          columns={columns}
          pagination={pagination}
          selected={[]}
          loading={loading}
          actions={{ update: () => {}, delete: () => {} }}
          onRowSelectionChange={() => {}}
          onRequest={setPagination}
        />
      </div>
    </div>
  )
}
