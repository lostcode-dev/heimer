import { supabase } from './supabaseClient'

// Helper: fetch and cache current company id for this session
let __companyIdCache: string | null = null
async function getCompanyIdOrThrow(): Promise<string> {
  if (__companyIdCache) return __companyIdCache
  const { data, error } = await supabase.rpc('current_company_id')
  if (error) throw error
  const cid = data as unknown as string | null
  if (!cid) throw new Error('Nenhuma empresa ativa vinculada ao usuário.')
  __companyIdCache = cid
  return cid
}

// AUTH
export const apiAuth = {
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    return data
  },
}

// CUSTOMERS
export const apiCustomers = {
  async list(query?: string) {
    let q = supabase.from('customers').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (query) q = q.ilike('full_name', `%${query}%`)
    const { data, error } = await q
    if (error) throw error
    return data
  },
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

    if (query && query.trim()) {
      q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    }

    const { data, error, count } = await q
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async create(input: { full_name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; birth_date?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase
      .from('customers')
      .insert({
        company_id: cid,
        full_name: input.full_name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? null,
        is_active: input.is_active ?? true,
        cep: input.cep ?? null,
        street: input.street ?? null,
        number: input.number ?? null,
        complement: input.complement ?? null,
        neighborhood: input.neighborhood ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        birth_date: input.birth_date ? input.birth_date.slice(0, 10) : null,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },
  async update(id: string, input: { full_name?: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; birth_date?: string | null }) {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...input,
        birth_date: input.birth_date === undefined ? undefined : (input.birth_date ? input.birth_date.slice(0, 10) : null),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    // soft delete by setting deleted_at
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return true
  },
  async removeMany(ids: string[]) {
    if (!ids.length) return 0
    const { error, data } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids)
      .select('id')
    if (error) throw error
    return data?.length ?? 0
  },
}

// PRODUCTS
export const apiProducts = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase.from('products_with_stock').select('*', { count: 'exact' }).order(sortBy, { ascending: sortDir === 'asc' }).range(from, to)
  if (query && query.trim()) q = q.or(`sku.ilike.%${query}%,name.ilike.%${query}%`)
    const { data, error, count } = await q
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async create(input: { sku: string; name: string; category?: string | null; unit_cost?: number; unit_price: number; reorder_level?: number; categories?: string[]; tags?: string[] }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase.from('products').insert({
      company_id: cid,
      sku: input.sku,
      name: input.name,
      category: input.category ?? null,
      unit_cost: input.unit_cost ?? 0,
      unit_price: input.unit_price,
      reorder_level: input.reorder_level ?? 0,
      categories: input.categories ?? null,
      tags: input.tags ?? null,
    }).select('*').single()
    if (error) throw error
    return data
  },
  async update(id: string, input: Partial<{ sku: string; name: string; category?: string | null; unit_cost?: number; unit_price: number; reorder_level?: number; categories?: string[]; tags?: string[] }>) {
    const { data, error } = await supabase.from('products').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    return true
  },
  async removeMany(ids: string[]) {
    if (!ids.length) return 0
    const { data, error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).in('id', ids).select('id')
    if (error) throw error
    return data?.length ?? 0
  },
}

// PRODUCT SUPPLIERS
export const apiProductSuppliers = {
  async listByProduct(productId: string) {
    const { data, error } = await supabase
      .from('product_suppliers')
      .select('supplier_id, supplier_sku, supplier_price, notes, suppliers(name, phone)')
      .eq('product_id', productId)
    if (error) throw error
    return (data ?? []).map((r: any) => ({
      supplier_id: r.supplier_id as string,
      supplier_name: r.suppliers?.name as string | undefined,
      supplier_phone: r.suppliers?.phone as string | undefined,
      supplier_sku: r.supplier_sku as string | null,
      supplier_price: Number(r.supplier_price ?? 0),
      notes: r.notes as string | null,
    }))
  },
  async upsertMany(productId: string, items: Array<{ supplier_id: string; supplier_sku?: string | null; supplier_price?: number | null; notes?: string | null }>) {
    if (!items?.length) return 0
    const payload = items.map((i) => ({
      product_id: productId,
      supplier_id: i.supplier_id,
      supplier_sku: i.supplier_sku ?? null,
      supplier_price: i.supplier_price ?? null,
      notes: i.notes ?? null,
    }))
    const { data, error } = await supabase.from('product_suppliers').upsert(payload, { onConflict: 'product_id,supplier_id' }).select('supplier_id')
    if (error) throw error
    return data?.length ?? 0
  },
  async remove(productId: string, supplierId: string) {
    const { error } = await supabase.from('product_suppliers').delete().eq('product_id', productId).eq('supplier_id', supplierId)
    if (error) throw error
    return true
  },
  async replaceAll(productId: string, items: Array<{ supplier_id: string; supplier_sku?: string | null; supplier_price?: number | null; notes?: string | null }>) {
    // Simple strategy: delete all and insert provided
    const { error: delErr } = await supabase.from('product_suppliers').delete().eq('product_id', productId)
    if (delErr) throw delErr
    if (!items?.length) return 0
    return this.upsertMany(productId, items)
  },
}

export const apiServices = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('services')
      .select('*, service_technicians(technicians(full_name))', { count: 'exact' })
      .is('deleted_at', null)
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (query && query.trim()) q = q.or(`sku.ilike.%${query}%,name.ilike.%${query}%,category.ilike.%${query}%`)
    const { data, error, count } = await q
    if (error) throw error
    // Normalize technicians as array of names for UI convenience
    const rows = (data ?? []).map((r: any) => ({
      ...r,
      technicians: Array.isArray(r.service_technicians) ? (r.service_technicians.map((t: any) => t.technicians?.full_name).filter(Boolean)) : [],
    }))
    return { data: rows, count: count ?? 0 }
  },
  async create(input: { sku?: string; name: string; unit_price: number; unit_cost?: number; categories?: string[]; tags?: string[] }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase.from('services').insert({
      company_id: cid,
      sku: input.sku ?? null,
      name: input.name,
      unit_price: input.unit_price,
      unit_cost: input.unit_cost ?? 0,
      categories: input.categories ?? null,
      tags: input.tags ?? null,
    }).select('*').single()
    if (error) throw error
    return data
  },
  async update(id: string, input: Partial<{ sku?: string; name: string; unit_price: number; unit_cost?: number; categories?: string[]; tags?: string[] }>) {
    const { data, error } = await supabase.from('services').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('services').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    return true
  },
  async removeMany(ids: string[]) {
    if (!ids.length) return 0
    const { data, error } = await supabase.from('services').update({ deleted_at: new Date().toISOString() }).in('id', ids).select('id')
    if (error) throw error
    return data?.length ?? 0
  },
}

// SERVICE TECHNICIANS (many-to-many)
export const apiServiceTechnicians = {
  async list(serviceId: string) {
    const { data, error } = await supabase
      .from('service_technicians')
      .select('technician_id, technician_price, technicians(full_name)')
      .eq('service_id', serviceId)
    if (error) throw error
    return (data ?? []).map((r: any) => ({
      technician_id: r.technician_id as string,
      name: r.technicians?.full_name as string | undefined,
      technician_price: Number(r.technician_price ?? 0),
    }))
  },
  async replaceAll(serviceId: string, items: Array<{ technician_id: string; technician_price?: number | null }>) {
    const { error: delErr } = await supabase.from('service_technicians').delete().eq('service_id', serviceId)
    if (delErr) throw delErr
    if (!items?.length) return 0
    // dedupe by technician_id, last one wins
    const map = new Map<string, { technician_id: string; technician_price?: number | null }>()
    for (const it of items) { if (it.technician_id) map.set(it.technician_id, it) }
    const payload = Array.from(map.values()).map((it) => ({ service_id: serviceId, technician_id: it.technician_id, technician_price: it.technician_price ?? null }))
    const { data, error } = await supabase.from('service_technicians').insert(payload).select('technician_id')
    if (error) throw error
    return data?.length ?? 0
  },
}

// TECHNICIANS
export const apiTechnicians = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase.from('technicians').select('*', { count: 'exact' }).is('deleted_at', null).order(sortBy, { ascending: sortDir === 'asc' }).range(from, to)
    if (query && query.trim()) q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    const { data, error, count } = await q
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async create(input: { full_name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase.from('technicians').insert({
      company_id: cid,
      full_name: input.full_name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      is_active: input.is_active ?? true,
      cep: input.cep ?? null,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
    }).select('*').single()
    if (error) throw error
    return data
  },
  async update(id: string, input: Partial<{ full_name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }>) {
    const { data, error } = await supabase.from('technicians').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('technicians').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    return true
  },
  async removeMany(ids: string[]) {
    if (!ids.length) return 0
    const { data, error } = await supabase.from('technicians').update({ deleted_at: new Date().toISOString() }).in('id', ids).select('id')
    if (error) throw error
    return data?.length ?? 0
  },
}

// ORDERS
export type OrderDeviceInput = {
  device_id?: string | null
  brand?: string
  model?: string
  imei?: string | null
  color?: string | null
  notes?: string | null
}

export type OrderItemInput = {
  kind: 'PRODUCT' | 'SERVICE'
  product_id?: string | null
  description: string
  qty: number
  unit_price: number
  total?: number
}

export type NewOrderInput = {
  customer_id: string
  // legacy single device still accepted but prefer devices[]
  device_id?: string | null
  problem_description: string
  labor_price?: number
  notes?: string | null
  // optional extras
  assigned_to?: string | null
  discount_amount?: number
  tax_amount?: number // used as shipping total
  delivered_at?: string | null
  devices?: OrderDeviceInput[]
  items?: OrderItemInput[]
}

export const apiOrders = {
  async previewTicket() {
    const { data, error } = await supabase.rpc('preview_next_ticket_number')
    if (error) throw error
    return (data as unknown as string) || ''
  },
  async create(input: NewOrderInput) {
    // 1) create base order
    const cid = await getCompanyIdOrThrow()
    const { data: order, error } = await supabase
      .from('service_orders')
      .insert({
        company_id: cid,
        customer_id: input.customer_id,
        device_id: input.device_id ?? null,
        problem_description: input.problem_description,
        labor_price: input.labor_price ?? 0,
        notes: input.notes ?? null,
        assigned_to: input.assigned_to ?? null,
        discount_amount: input.discount_amount ?? 0,
        tax_amount: input.tax_amount ?? 0,
        delivered_at: input.delivered_at ?? null,
      })
      .select('*')
      .single()
    if (error) throw error

    const orderId = (order as any).id as string

    // 2) devices
    if (input.devices && input.devices.length) {
      for (const d of input.devices) {
        let deviceId = d.device_id ?? null
        if (!deviceId && (d.brand && d.model)) {
          const { data: createdDevice, error: devErr } = await supabase
            .from('devices')
            .insert({
              company_id: cid,
              customer_id: input.customer_id,
              brand: d.brand!,
              model: d.model!,
              imei: d.imei ?? null,
              color: d.color ?? null,
              notes: d.notes ?? null,
            })
            .select('id')
            .single()
          if (devErr) throw devErr
          deviceId = (createdDevice as any).id
        }
        if (deviceId) {
          const { error: linkErr } = await supabase
            .from('service_order_devices')
            .insert({ service_order_id: orderId, device_id: deviceId })
          if (linkErr) throw linkErr
        }
      }
    }

    // 3) items
    if (input.items && input.items.length) {
      for (const it of input.items) {
        const payload: any = {
          company_id: cid,
          service_order_id: orderId,
          product_id: it.product_id ?? null,
          description: it.description,
          qty: it.qty,
          unit_price: it.unit_price,
          total: it.total ?? (Number(it.qty) * Number(it.unit_price)),
          kind: it.kind,
        }
        const { error: itemErr } = await supabase.from('service_order_items').insert(payload)
        if (itemErr) throw itemErr
      }
    }

    return order
  },
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('service_orders')
      .select('id,ticket_number,status,total_amount,created_at, customer:customer_id(full_name,phone)', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

    if (query && query.trim()) {
      q = q.or(`ticket_number.ilike.%${query}%,problem_description.ilike.%${query}%`)
    }

    const { data, error, count } = await q
    if (error) throw error
    // Normalize customer name
    const rows = (data ?? []).map((r: any) => ({
      ...r,
      customer_name: r.customer?.full_name ?? '-',
      customer_phone: r.customer?.phone ?? null,
    }))
    return { data: rows, count: count ?? 0 }
  },
  async getById(id: string) {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, customer:customer_id(full_name,email,phone), device:device_id(*), devices:service_order_devices(device:device_id(*)), items:service_order_items(*), technician:assigned_to(full_name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  async update(id: string, input: Partial<NewOrderInput> & { status?: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'DELIVERED' | 'CANCELLED'; diagnostics?: string; discount_amount?: number; tax_amount?: number; assigned_to?: string | null; delivered_at?: string | null }) {
    // 1) update base order fields
    const base: any = { ...input }
    delete base.devices
    delete base.items
    const { data: updated, error } = await supabase
      .from('service_orders')
      .update(base)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error

    // 2) replace devices if provided
    if (input.devices) {
      // remove existing links
      const { error: delErr } = await supabase.from('service_order_devices').delete().eq('service_order_id', id)
      if (delErr) throw delErr
      for (const d of input.devices) {
        let deviceId = d.device_id ?? null
        if (!deviceId && (d.brand && d.model)) {
          const cid = await getCompanyIdOrThrow()
          const { data: createdDevice, error: devErr } = await supabase
            .from('devices')
            .insert({
              company_id: cid,
              customer_id: (updated as any).customer_id,
              brand: d.brand!,
              model: d.model!,
              imei: d.imei ?? null,
              color: d.color ?? null,
              notes: d.notes ?? null,
            })
            .select('id')
            .single()
          if (devErr) throw devErr
          deviceId = (createdDevice as any).id
        }
        if (deviceId) {
          const { error: linkErr } = await supabase
            .from('service_order_devices')
            .insert({ service_order_id: id, device_id: deviceId })
          if (linkErr) throw linkErr
        }
      }
    }

    // 3) replace items if provided
    if (input.items) {
      const { error: delItemsErr } = await supabase.from('service_order_items').delete().eq('service_order_id', id)
      if (delItemsErr) throw delItemsErr
      for (const it of input.items) {
        const payload: any = {
          company_id: await getCompanyIdOrThrow(),
          service_order_id: id,
          product_id: it.product_id ?? null,
          description: it.description,
          qty: it.qty,
          unit_price: it.unit_price,
          total: it.total ?? (Number(it.qty) * Number(it.unit_price)),
          kind: it.kind,
        }
        const { error: itemErr } = await supabase.from('service_order_items').insert(payload)
        if (itemErr) throw itemErr
      }
    }

    return updated
  },
  async remove(id: string) {
    // Try hard delete; if blocked by RLS, fallback to status = CANCELLED
    const del = await supabase.from('service_orders').delete().eq('id', id)
    if (del.error) {
      // Fallback: cancel order
      const { error } = await supabase.from('service_orders').update({ status: 'CANCELLED' }).eq('id', id)
      if (error) throw error
      return 'CANCELLED'
    }
    return 'DELETED'
  },
}

// DEVICES
export const apiDevices = {
  async create(input: { brand: string; model: string; imei?: string | null; color?: string | null; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase
      .from('devices')
      .insert({
        company_id: cid,
        brand: input.brand,
        model: input.model,
        imei: input.imei ?? null,
        color: input.color ?? null,
        notes: input.notes ?? null,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },
}

// CASH
export const apiCash = {
  async getOpenSession() {
    const { data, error } = await supabase.from('cash_sessions').select('*').is('closed_at', null).order('opened_at', { ascending: false }).limit(1).maybeSingle()
    if (error) throw error
    return data
  },
  async openSession(input: { opening_amount?: number; notes?: string | null; opened_by?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase.from('cash_sessions').insert({
      company_id: cid,
      opening_amount: input.opening_amount ?? 0,
      notes: input.notes ?? null,
      opened_by: input.opened_by ?? null,
    }).select('*').single()
    if (error) throw error
    return data
  },
  async listMovements(sessionId: string, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
      .from('cash_movements')
      .select('*', { count: 'exact' })
      .eq('cash_session_id', sessionId)
      .order('occurred_at', { ascending: false })
      .range(from, to)
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async addManualMovement(input: { cash_session_id: string; type: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT'; amount: number; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase.from('cash_movements').insert({
      company_id: cid,
      cash_session_id: input.cash_session_id,
      type: input.type,
      amount: input.amount,
      notes: input.notes ?? null,
      reference_type: 'MANUAL',
    }).select('*').single()
    if (error) throw error
    return data
  },
  async attachPendingCashPayments(sessionId: string) {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('id')
      .is('cash_session_id', null)
      .eq('method', 'CASH')
    if (error) throw error
    for (const p of payments ?? []) {
      const { error: updErr } = await supabase.from('payments').update({ cash_session_id: sessionId }).eq('id', (p as any).id)
      if (updErr) throw updErr
    }
    return payments?.length ?? 0
  },
  async closeSession(sessionId: string, closedBy?: string | null) {
    const { data, error } = await supabase.functions.invoke('close-cash-session', {
      body: { sessionId, closedBy: closedBy ?? null },
    })
    if (error) throw new Error((error as any)?.message ?? 'Falha ao fechar o caixa')
    return (data ?? {}) as { url?: string }
  },
}

// REPORTS
export const apiReports = {
  async fetch(category: string, subcategory: string, range: { start: string; end: string }) {
    const start = range.start
    const end = range.end
    if (category === 'overview' && subcategory === 'kpis') {
      // revenue = sum(payments.amount) in range
      const { data: rev, error: revErr } = await supabase
        .from('payments')
        .select('amount')
        .gte('received_at', start)
        .lte('received_at', end)
      if (revErr) throw revErr
      const revenue7d = (rev ?? []).reduce((acc, r) => acc + Number((r as any).amount || 0), 0)

      // prev 7d
      const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7)
      const prevEnd = new Date(end); prevEnd.setDate(prevEnd.getDate() - 7)
      const { data: revPrev } = await supabase
        .from('payments')
        .select('amount')
        .gte('received_at', prevStart.toISOString())
        .lte('received_at', prevEnd.toISOString())
      const revenuePrev7d = (revPrev ?? []).reduce((acc, r) => acc + Number((r as any).amount || 0), 0)

      // orders count and average ticket (payments linked to service orders)
      const { data: orders } = await supabase
        .from('service_orders')
        .select('id, total_amount')
        .gte('created_at', start)
        .lte('created_at', end)
      const ordersCount = orders?.length ?? 0
      const avgTicket = ordersCount > 0 ? (orders ?? []).reduce((acc, o) => acc + Number((o as any).total_amount || 0), 0) / ordersCount : 0

      const { data: ordersPrev } = await supabase
        .from('service_orders')
        .select('id, total_amount')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString())
      const ordersPrevCount = ordersPrev?.length ?? 0
      const avgTicketPrev = ordersPrevCount > 0 ? (ordersPrev ?? []).reduce((acc, o) => acc + Number((o as any).total_amount || 0), 0) / ordersPrevCount : 0

      // customers served (unique customers with orders in period)
      const { data: custs } = await supabase
        .from('service_orders')
        .select('customer_id')
        .gte('created_at', start)
        .lte('created_at', end)
      const customersServed = new Set((custs ?? []).map((r: any) => r.customer_id)).size

      const { data: custsPrev } = await supabase
        .from('service_orders')
        .select('customer_id')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString())
      const customersServedPrev = new Set((custsPrev ?? []).map((r: any) => r.customer_id)).size

      return { revenue7d, revenuePrev7d, ordersCount, ordersPrev: ordersPrevCount, avgTicket, avgTicketPrev, customersServed, customersServedPrev }
    }

    if (category === 'sales' && subcategory === 'top-products') {
      // Sum quantities and totals from service_order_items (products only)
      const { data: items, error } = await supabase
        .from('service_order_items')
        .select('product_id, qty, total, product:product_id(sku,name)')
        .gte('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      const rows = (items ?? [])
        .filter((r: any) => r.product_id)
        .reduce((acc: Record<string, { product_id: string; sku: string; name: string; qty: number; total: number }>, r: any) => {
          const k = r.product_id
          if (!acc[k]) acc[k] = { product_id: k, sku: r.product?.sku ?? '', name: r.product?.name ?? '', qty: 0, total: 0 }
          acc[k].qty += Number(r.qty || 0)
          acc[k].total += Number(r.total || 0)
          return acc
        }, {})
      const list = Object.values(rows).sort((a, b) => b.total - a.total).slice(0, 10)
      return { list }
    }

    if (category === 'services' && subcategory === 'orders-status') {
      const { data, error } = await supabase
        .from('service_orders')
        .select('status')
        .gte('created_at', start)
        .lte('created_at', end)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const r of data ?? []) counts[(r as any).status] = (counts[(r as any).status] || 0) + 1
      return { counts }
    }

    // Default fallback
    return {}
  },
}

// INVENTORY
export type InventoryMovement = {
  id: string
  product_id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  qty: number
  reason?: string | null
  reference_id?: string | null
  reference_type: 'SERVICE_ORDER' | 'MANUAL'
  occurred_at: string
  product?: { id: string; sku: string; name: string } | null
}

export const apiInventory = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'occurred_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('inventory_movements')
      .select('*, product:product_id(id,sku,name)', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

    if (query && query.trim()) {
      // filter by product sku/name using join alias "product"
      q = q.or(`reason.ilike.%${query}%`)
    }

    const { data, error, count } = await q
    if (error) throw error
    return { data: (data ?? []) as unknown as InventoryMovement[], count: count ?? 0 }
  },
  async create(input: { product_id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; qty: number; reason?: string | null; occurred_at?: string }) {
    const { data, error } = await supabase.rpc('apply_inventory_movement', {
      p_product_id: input.product_id,
      p_type: input.type,
      p_qty: input.qty,
      p_reason: input.reason ?? null,
      p_occurred_at: input.occurred_at ?? new Date().toISOString(),
    })
    if (error) throw error
    return data as unknown as InventoryMovement
  },
  async update(id: string, input: Partial<{ product_id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; qty: number; reason?: string | null; occurred_at?: string }>) {
    const { data, error } = await supabase.rpc('update_inventory_movement', {
      p_id: id,
      p_product_id: input.product_id ?? null,
      p_type: input.type ?? null,
      p_qty: input.qty ?? null,
      p_reason: input.reason ?? null,
      p_occurred_at: input.occurred_at ?? null,
    })
    if (error) throw error
    return data as unknown as InventoryMovement
  },
  async remove(id: string) {
    const { error } = await supabase.rpc('delete_inventory_movement', { p_id: id })
    if (error) throw error
    return true
  },
  async removeMany(ids: string[]) {
    if (!ids.length) return 0
    let removed = 0
    for (const mid of ids) {
      const { error } = await supabase.rpc('delete_inventory_movement', { p_id: mid })
      if (error) throw error
      removed += 1
    }
    return removed
  },
}

export const apiProductSearch = {
  async search(query: string) {
    let q = supabase.from('products').select('id,sku,name').is('deleted_at', null).order('name', { ascending: true }).limit(20)
    if (query && query.trim()) q = q.or(`sku.ilike.%${query}%,name.ilike.%${query}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },
}

export const apiCustomerSearch = {
  async search(query: string) {
    let q = supabase.from('customers').select('id,full_name,phone').is('deleted_at', null).order('full_name', { ascending: true }).limit(20)
    if (query && query.trim()) q = q.ilike('full_name', `%${query}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },
}

export const apiTechnicianSearch = {
  async search(query: string) {
    let q = supabase.from('technicians').select('id,full_name,phone').is('deleted_at', null).order('full_name', { ascending: true }).limit(20)
    if (query && query.trim()) q = q.ilike('full_name', `%${query}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },
}

export const apiServiceSearch = {
  async search(query: string) {
    let q = supabase.from('services').select('id,sku,name,unit_price').is('deleted_at', null).order('name', { ascending: true }).limit(20)
    if (query && query.trim()) q = q.or(`sku.ilike.%${query}%,name.ilike.%${query}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },
}

// SUPPLIERS
export const apiSuppliers = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

    if (query && query.trim()) {
      q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    }

    const { data, error, count } = await q
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async create(input: { name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        company_id: cid,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? null,
        is_active: input.is_active ?? true,
        cep: input.cep ?? null,
        street: input.street ?? null,
        number: input.number ?? null,
        complement: input.complement ?? null,
        neighborhood: input.neighborhood ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },
  async update(id: string, input: Partial<{ name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }>) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('suppliers').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    return true
  },
  async removeMany(ids: string[]) {
    if (!ids.length) return 0
    const { data, error } = await supabase.from('suppliers').update({ deleted_at: new Date().toISOString() }).in('id', ids).select('id')
    if (error) throw error
    return data?.length ?? 0
  },
}

export const apiSupplierSearch = {
  async search(query: string) {
    let q = supabase.from('suppliers').select('id,name,phone').is('deleted_at', null).order('name', { ascending: true }).limit(20)
    if (query && query.trim()) q = q.ilike('name', `%${query}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },
}

// ADMIN
export const apiCompanies = {
  async getMyCompany() {
    const { data, error } = await supabase.rpc('current_company_id')
    if (error) throw error
    const companyId = data as unknown as string | null
    if (!companyId) return null
    const { data: company, error: cErr } = await supabase.from('companies').select('*').eq('id', companyId).single()
    if (cErr) throw cErr
    return company
  },
  async upsertMyCompany(input: { name: string; email?: string | null; phone?: string | null; tax_id?: string | null; website?: string | null; notes?: string | null; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }) {
    // If user has a company -> update, else create and link
    const { data: cid } = await supabase.rpc('current_company_id')
    const companyId = cid as unknown as string | null
    const payload = {
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      tax_id: input.tax_id ?? null,
      website: input.website ?? null,
      notes: input.notes ?? null,
      cep: input.cep ?? null,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
    }
    if (companyId) {
      const { data, error } = await supabase.from('companies').update(payload).eq('id', companyId).select('*').single()
      if (error) throw error
      return data
    }
    const { data: created, error: cErr } = await supabase.from('companies').insert(payload).select('*').single()
    if (cErr) throw cErr
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (uid) {
      const { error: linkErr } = await supabase.from('user_companies').upsert({ user_id: uid, company_id: (created as any).id, role: 'OWNER' })
      if (linkErr) throw linkErr
    }
    return created
  },
}

// BILLING
export const apiBilling = {
  async getOverview() {
    // subscriptions: latest by current_period_end
    const { data: cid, error: cidErr } = await supabase.rpc('current_company_id')
    if (cidErr) throw cidErr
    const companyId = cid as unknown as string | null
    if (!companyId) return { subscription: null, invoices: [], customer: null }
    const { data: sub } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle()
    const { data: invoices } = await supabase
      .from('billing_invoices')
      .select('*')
      .eq('company_id', companyId)
      .order('invoice_date', { ascending: false })
      .limit(12)
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle()
    return { subscription: sub ?? null, invoices: invoices ?? [], customer: customer ?? null }
  },
  async createPortalSession() {
    const { data, error } = await supabase.functions.invoke('stripe-portal', { body: { action: 'portal' } })
    if (error) throw new Error((error as any)?.message ?? 'Falha ao criar portal')
    return data as { url: string }
  },
  async createCheckoutSession() {
    const { data, error } = await supabase.functions.invoke('stripe-portal', { body: { action: 'checkout' } })
    if (error) throw new Error((error as any)?.message ?? 'Falha ao criar checkout')
    return data as { url: string }
  },
}

export const apiAdminUsers = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy: _sortBy = 'created_at', sortDir: _sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    // Join auth.users -> public.users and filter by current_company_id via user_companies
    let q = supabase
      .from('user_companies')
      .select('user_id, users:user_id(full_name, created_at), auth:auth.users!inner(email)')
      .range(from, to)
    if (query && query.trim()) {
      // we cannot ilike over joined columns directly in a portable way; keep simple on full_name for now
      q = q; // placeholder
    }
    const { data, error } = await q
    if (error) throw error
    const rows = (data ?? []).map((r: any) => ({
      full_name: r.users?.full_name ?? '-',
      email: r.auth?.email ?? '-',
      created_at: r.users?.created_at ?? null,
    }))
    return { data: rows, count: rows.length }
  },
}

// EMPLOYEES (App-scoped staff management)
export const apiEmployees = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase.from('users').select('*', { count: 'estimated' }).order('created_at', { ascending: false }).range(from, to)
    const { data, error, count } = await q
    if (error) throw error
    return { data, count }
  },
  async create(input: { full_name?: string; email: string; password: string; phone?: string | null; is_active?: boolean; job_title?: string | null; cpf?: string | null; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; birth_date?: string | null; hire_date?: string | null; notes?: string | null }) {
    // Ensure multitenancy: include company_id in the payload
    const company_id = await getCompanyIdOrThrow()
    const { data, error } = await supabase.functions.invoke('create-employee', { body: { ...input, company_id } })
    if (error) throw new Error((error as any)?.message ?? 'Falha ao criar funcionário')
    return data
  },
  async update(id: string, patch: { full_name?: string; phone?: string | null; is_active?: boolean; job_title?: string | null; cpf?: string | null; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null; birth_date?: string | null; hire_date?: string | null; notes?: string | null }) {
    const { data, error } = await supabase.from('users').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
    return true
  },
  async removeMany(ids: string[]) {
    const { error } = await supabase.from('users').delete().in('id', ids)
    if (error) throw error
    return true
  },
}
