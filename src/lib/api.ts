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
  async getById(id: string) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
    if (error) throw error
    return data
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
  async listAllWithStock() {
    // Fetch all products with computed stock from view
    let page = 0
    const pageSize = 1000
    const out: any[] = []
    // Loop to avoid enormous payloads; stop when less than pageSize returned
    while (true) {
      const from = page * pageSize
      const to = from + pageSize - 1
      const { data, error } = await supabase
        .from('products_with_stock')
        .select('*')
        .order('name', { ascending: true })
        .range(from, to)
      if (error) throw error
      out.push(...(data ?? []))
      if (!data || data.length < pageSize) break
      page += 1
    }
    return out
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
  async getById(id: string) {
    const { data, error } = await supabase
      .from('products_with_stock')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  async getStockFor(ids: string[]): Promise<Record<string, number>> {
    if (!ids?.length) return {}
    const { data, error } = await supabase
      .from('products_with_stock')
      .select('id,stock_qty')
      .in('id', ids)
    if (error) throw error
    const out: Record<string, number> = {}
    for (const r of (data ?? []) as any[]) {
      out[r.id] = Number(r.stock_qty ?? 0)
    }
    return out
  },
  async getBySku(sku: string) {
    const { data, error } = await supabase
      .from('products_with_stock')
      .select('*')
      .eq('sku', sku)
      .single()
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
  diagnostics?: string | null
  executed_service?: string | null
  labor_price?: number
  notes?: string | null
  // optional extras
  status?: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'DELIVERED' | 'CANCELLED'
  due_date?: string | null
  assigned_to?: string | null // legacy: user id; prefer technician_id
  technician_id?: string | null
  discount_amount?: number
  tax_amount?: number // used as shipping total
  delivered_at?: string | null
  devices?: OrderDeviceInput[]
  items?: OrderItemInput[]
  payment_method?: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER' | 'FIADO'
}

export const apiOrders = {
  async previewTicket() {
    const { data, error } = await supabase.rpc('preview_next_ticket_number')
    if (error) throw error
    return (data as unknown as string) || ''
  },
  async listByCustomer(customerId: string, params: { page: number; pageSize: number; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
      .from('service_orders')
      .select('id, ticket_number, status, total_amount, created_at')
      .eq('customer_id', customerId)
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async create(input: NewOrderInput) {
    // 1) create base order
    const cid = await getCompanyIdOrThrow()
    const uid = (await supabase.auth.getUser()).data.user?.id ?? null
    const { data: order, error } = await supabase
      .from('service_orders')
      .insert({
        company_id: cid,
        customer_id: input.customer_id,
        device_id: input.device_id ?? null,
        problem_description: input.problem_description,
        diagnostics: input.diagnostics ?? null,
        executed_service: input.executed_service ?? null,
        labor_price: input.labor_price ?? 0,
        notes: input.notes ?? null,
        status: input.status ?? 'OPEN',
        due_date: input.due_date ?? null,
        assigned_to: input.assigned_to ?? null,
        technician_id: input.technician_id ?? null,
        discount_amount: input.discount_amount ?? 0,
        tax_amount: input.tax_amount ?? 0,
        delivered_at: input.delivered_at ?? null,
        payment_method: input.payment_method ?? null,
        created_by: uid,
        created_employee_id: uid,
      })
      .select('*')
      .single()
    if (error) throw error

    const orderId = (order as any).id as string

    // Audit: create entry
    await supabase.from('service_order_audit_logs').insert({
      service_order_id: orderId,
      actor_user_id: uid,
      action: 'CREATE',
      field: null,
      old_value: null,
      new_value: JSON.stringify({ customer_id: input.customer_id, device_id: input.device_id ?? null, labor_price: input.labor_price ?? 0, assigned_to: input.assigned_to ?? null, technician_id: input.technician_id ?? null }),
    })

    // 2) devices
    if (input.devices && input.devices.length) {
      let firstDeviceId: string | null = null
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
          if (!firstDeviceId) firstDeviceId = deviceId
          const { error: linkErr } = await supabase
            .from('service_order_devices')
            .insert({ service_order_id: orderId, device_id: deviceId })
          if (linkErr) throw linkErr
        }
      }
      // Update header legacy device_id with the first device
      if (firstDeviceId) {
        await supabase.from('service_orders').update({ device_id: firstDeviceId }).eq('id', orderId)
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

    // 4) FIADO: create receivable linked to SERVICE_ORDER when payment_method is FIADO
    try {
      if (input.payment_method === 'FIADO') {
        // Compute total: use service_orders.total_amount (trigger updates it), fetch fresh value
        const { data: afterOrder } = await supabase
          .from('service_orders')
          .select('id, total_amount')
          .eq('id', orderId)
          .single()
        const totalAmt = Number((afterOrder as any)?.total_amount ?? 0)
        if (totalAmt > 0) {
          await apiReceivables.create({
            customer_id: input.customer_id,
            description: 'Ordem de Serviço',
            issue_date: new Date().toISOString().slice(0, 10),
            due_date: null, // nullable by migration 0038
            amount: totalAmt,
            notes: 'Gerado automaticamente por OS (fiado)',
            reference_type: 'SERVICE_ORDER',
            reference_id: orderId,
          })
        }
      }
    } catch (_) {
      // swallow receivable creation errors to not block OS creation
    }

    // Return fresh order header so fields like device_id are up-to-date
    const { data: fresh } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', orderId)
      .single()
    return fresh ?? order
  },
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, query, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('service_orders')
      .select('id,ticket_number,status,total_amount,created_at,due_date, customer:customer_id(full_name,phone), technician:technician_id(full_name,phone), technician_user:assigned_to(full_name,phone)', { count: 'exact' })

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
      technician_name: (r.technician?.full_name ?? r.technician_user?.full_name) ?? '-',
      technician_phone: (r.technician?.phone ?? r.technician_user?.phone) ?? null,
      due_date: r.due_date ?? null,
    }))
    return { data: rows, count: count ?? 0 }
  },
  async getById(id: string) {
    const { data, error } = await supabase
      .from('service_orders')
  .select('*, customer:customer_id(full_name,email,phone), device:device_id(*), devices:service_order_devices(device:device_id(*)), items:service_order_items(*), technician_user:assigned_to(full_name), technician:technician_id(full_name,phone)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  async listAuditLogs(orderId: string) {
    const { data, error } = await supabase
      .from('service_order_audit_logs')
      .select('id, action, field, old_value, new_value, created_at, actor:actor_user_id(id, full_name)')
      .eq('service_order_id', orderId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r: any) => ({
      id: r.id,
      action: r.action as string,
      field: r.field as string | null,
      old_value: r.old_value as string | null,
      new_value: r.new_value as string | null,
      created_at: r.created_at as string,
      actor: r.actor ?? null,
    }))
  },
  async update(id: string, input: Partial<NewOrderInput> & { status?: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'DELIVERED' | 'CANCELLED'; diagnostics?: string | null; executed_service?: string | null; discount_amount?: number; tax_amount?: number; assigned_to?: string | null; technician_id?: string | null; delivered_at?: string | null; due_date?: string | null; notes?: string | null; payment_method?: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER' | 'FIADO' }) {
    // 1) update base order fields
  const base: any = { ...input }
    delete base.devices
    delete base.items
    const { data: before, error: getErr } = await supabase.from('service_orders').select('*').eq('id', id).single()
    if (getErr) throw getErr
    const { data: updated, error } = await supabase
      .from('service_orders')
      .update(base)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error

    // Audit: diff simple fields
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null
      const changed: Record<string, { old: any; val: any }> = {}
      for (const k of ['status','diagnostics','executed_service','labor_price','discount_amount','tax_amount','assigned_to','technician_id','delivered_at','notes','problem_description','payment_method','due_date'] as const) {
        if ((before as any)[k] !== (updated as any)[k]) {
          changed[k] = { old: (before as any)[k], val: (updated as any)[k] }
        }
      }
      const entries = Object.entries(changed).map(([field, { old, val }]) => ({
        service_order_id: id,
        actor_user_id: uid,
        action: 'UPDATE',
        field,
        old_value: old == null ? null : String(old),
        new_value: val == null ? null : String(val),
      }))
      if (entries.length) {
        await supabase.from('service_order_audit_logs').insert(entries)
      }
    } catch {}

    // 2) replace devices if provided
    if (input.devices) {
      // remove existing links
      const { error: delErr } = await supabase.from('service_order_devices').delete().eq('service_order_id', id)
      if (delErr) throw delErr
      let firstDeviceId: string | null = null
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
          if (!firstDeviceId) firstDeviceId = deviceId
          const { error: linkErr } = await supabase
            .from('service_order_devices')
            .insert({ service_order_id: id, device_id: deviceId })
          if (linkErr) throw linkErr
        }
      }
      // Update header device_id based on first linked device (or null if none provided)
      await supabase.from('service_orders').update({ device_id: firstDeviceId }).eq('id', id)
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
      // Audit cancel
      try {
        const uid = (await supabase.auth.getUser()).data.user?.id ?? null
        await supabase.from('service_order_audit_logs').insert({ service_order_id: id, actor_user_id: uid, action: 'CANCEL' })
      } catch {}
      if (error) throw error
      return 'CANCELLED'
    }
    // On hard delete, also remove receivables linked to this service order
    try {
      await supabase
        .from('receivables')
        .delete()
        .eq('reference_type', 'SERVICE_ORDER')
        .eq('reference_id', id)
    } catch {}
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null
      await supabase.from('service_order_audit_logs').insert({ service_order_id: id, actor_user_id: uid, action: 'DELETE' })
    } catch {}
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
  async addIncome(input: { cash_session_id: string; amount: number; method?: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase.from('cash_movements').insert({
      company_id: cid,
      cash_session_id: input.cash_session_id,
      type: 'DEPOSIT',
      amount: Math.abs(input.amount),
      reference_type: 'MANUAL',
      method: input.method ?? null,
      notes: input.notes ?? 'Venda direta',
    }).select('*').single()
    if (error) throw error
    return data
  },
  async addExpense(input: { cash_session_id: string; amount: number; category: 'FORNECEDOR' | 'OPERACIONAL' | 'OUTROS'; method?: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const { data, error } = await supabase.from('cash_movements').insert({
      company_id: cid,
      cash_session_id: input.cash_session_id,
      type: 'WITHDRAWAL',
      amount: -Math.abs(input.amount),
      reference_type: 'MANUAL',
      category: input.category,
      method: input.method ?? null,
      notes: input.notes ?? null,
    }).select('*').single()
    if (error) throw error
    return data
  },
  async addInternal(input: { cash_session_id: string; kind: 'REFORCO' | 'SANGRIA'; amount: number; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const type = input.kind === 'REFORCO' ? 'DEPOSIT' : 'WITHDRAWAL'
    const amt = input.kind === 'REFORCO' ? Math.abs(input.amount) : -Math.abs(input.amount)
    const { data, error } = await supabase.from('cash_movements').insert({
      company_id: cid,
      cash_session_id: input.cash_session_id,
      type,
      amount: amt,
      reference_type: 'MANUAL',
      notes: input.notes ?? (input.kind === 'REFORCO' ? 'Reforço de caixa' : 'Sangria'),
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
  async closeSession(sessionId: string, input?: { counted_amount?: number; closedBy?: string | null }) {
    // Persist reconciliation values first
    const patch: any = {}
    if (typeof input?.counted_amount === 'number') {
      patch.counted_amount = input.counted_amount
    }
    if (Object.keys(patch).length > 0) {
      const { error: updErr } = await supabase.from('cash_sessions').update(patch).eq('id', sessionId)
      if (updErr) throw updErr
    }
    const { data, error } = await supabase.functions.invoke('close-cash-session', {
      body: { sessionId, closedBy: input?.closedBy ?? null },
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
  async listByProductPaginated(productId: string, params: { page: number; pageSize: number; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, sortBy = 'occurred_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
      .from('inventory_movements')
      .select('*', { count: 'exact' })
      .eq('product_id', productId)
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
}

export const apiProductSearch = {
  async search(query: string) {
    let q = supabase.from('products_with_stock').select('id,sku,name,unit_price,stock_qty').order('name', { ascending: true }).limit(20)
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
    // Try RPC first
    let companyId: string | null = null
    try {
      const { data } = await supabase.rpc('current_company_id')
      companyId = (data as unknown as string | null) ?? null
    } catch (_e) {
      companyId = null
    }
    // Fallback: derive from user_companies if RPC not available or returned null
    if (!companyId) {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) return null
      const { data: link, error: linkErr } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (linkErr) throw linkErr
      companyId = (link as any)?.company_id ?? null
      if (!companyId) return null
    }
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

// FINANCE: RECEIVABLES & PAYABLES
export const apiReceivables = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc'; status?: string; startDate?: string; endDate?: string }) {
    const { page, pageSize, query, sortBy = 'due_date', sortDir = 'asc', status, startDate, endDate } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('receivables')
      .select('*, customer:customer_id(full_name), payments:receivable_payments(amount)', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

  if (status && status !== 'ALL') q = q.eq('status', status)
  if (startDate) q = q.gte('due_date', new Date(startDate).toISOString())
  if (endDate) q = q.lte('due_date', new Date(endDate).toISOString())
    if (query && query.trim()) q = q.or(`description.ilike.%${query}%,notes.ilike.%${query}%`)

    const { data, error, count } = await q
    if (error) throw error
    const rows = (data ?? []).map((r: any) => {
      const received = Array.isArray(r.payments) ? r.payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) : Number(r.received_total || 0)
      const remaining = Math.max(0, Number(r.amount || 0) - received)
      return { ...r, customer_name: r.customer?.full_name ?? '-', received_total: received, remaining }
    })
    return { data: rows, count: count ?? 0 }
  },
  async listByCustomerOpen(customerId: string) {
    const { data, error } = await supabase
      .from('receivables')
      .select('id, description, due_date, amount, received_total, status')
      .eq('customer_id', customerId)
      .in('status', ['OPEN','PARTIAL'])
      .order('due_date', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r: any) => ({ ...r, remaining: Math.max(0, Number(r.amount || 0) - Number(r.received_total || 0)) }))
  },
  async create(input: { customer_id?: string | null; description: string; issue_date?: string | null; due_date?: string | null; amount: number; notes?: string | null; reference_type?: 'DIRECT_SALE' | 'SERVICE_ORDER' | null; reference_id?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const payload: any = {
      company_id: cid,
      customer_id: input.customer_id ?? null,
      description: input.description,
      issue_date: input.issue_date ? input.issue_date.slice(0, 10) : null,
      due_date: input.due_date ? input.due_date.slice(0, 10) : null,
      amount: Number(input.amount),
  notes: input.notes ?? null,
  reference_type: input.reference_type ?? null,
  reference_id: input.reference_id ?? null,
    }
    const { data, error } = await supabase.from('receivables').insert(payload).select('*').single()
    if (error) throw error
    return data
  },
  async addReceipt(input: { receivable_id: string; amount: number; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null; cash_session_id?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const amt = Math.abs(Number(input.amount))
    const { data: rec, error: recErr } = await supabase.from('receivables').select('id, amount, received_total').eq('id', input.receivable_id).single()
    if (recErr) throw recErr
    const received_total = Number((rec as any)?.received_total || 0) + amt
    const total = Number((rec as any)?.amount || 0)
    const status = received_total >= total ? 'PAID' : 'PARTIAL'
    const { error: payErr } = await supabase.from('receivable_payments').insert({
      company_id: cid,
      receivable_id: input.receivable_id,
      amount: amt,
      method: input.method,
      notes: input.notes ?? null,
      cash_session_id: input.cash_session_id ?? null,
    })
    if (payErr) throw payErr
    const { error: updErr } = await supabase.from('receivables').update({ received_total, status }).eq('id', input.receivable_id)
    if (updErr) throw updErr
    if (input.cash_session_id) {
      // create cash movement deposit
      await apiCash.addIncome({ cash_session_id: input.cash_session_id, amount: amt, method: input.method, notes: 'Recebimento' })
    }
    return true
  },

  // List FIADO (DIRECT_SALE) grouped by customer with pagination
  async listFiadosByCustomerPaginated(params: { page: number; pageSize: number; sortBy?: 'customer_name' | 'amount' | 'received_total' | 'remaining' | 'status'; sortDir?: 'asc' | 'desc'; query?: string }) {
    const { page, pageSize, sortBy = 'customer_name', sortDir = 'asc', query } = params
    // Fetch all open/partial fiados from direct sales with joined customer and payments
    let q = supabase
      .from('receivables')
  .select('id, customer_id, description, amount, received_total, status, reference_type, customer:customer_id(full_name, phone), payments:receivable_payments(amount)')
      .eq('reference_type', 'DIRECT_SALE')
      .in('status', ['OPEN','PARTIAL'])

    if (query && query.trim()) {
      q = q.or(`description.ilike.%${query}%,notes.ilike.%${query}%,customer.full_name.ilike.%${query}%`)
    }

    const { data, error } = await q
    if (error) throw error
    const rows = (data ?? []).map((r: any) => {
      const received = Array.isArray(r.payments) ? r.payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) : Number(r.received_total || 0)
      const remaining = Math.max(0, Number(r.amount || 0) - received)
      return { ...r, customer_name: r.customer?.full_name ?? '-', customer_phone: r.customer?.phone ?? null, received_total: received, remaining }
    })
    // Group by customer_id
    const map = new Map<string, { customer_id: string | null; customer_name: string; customer_phone?: string | null; amount: number; received_total: number; remaining: number; status: 'OPEN' | 'PARTIAL' | 'PAID' | 'CANCELLED' }>()
    for (const r of rows) {
      const key = r.customer_id ?? 'sem-cliente'
      const prev = map.get(key)
      const accAmount = Number(r.amount || 0)
      const accReceived = Number(r.received_total || 0)
      const accRemaining = Number(r.remaining || 0)
      if (!prev) {
        map.set(key, { customer_id: r.customer_id ?? null, customer_name: r.customer_name ?? '-', customer_phone: r.customer_phone ?? null, amount: accAmount, received_total: accReceived, remaining: accRemaining, status: accRemaining > 0 ? (accReceived > 0 ? 'PARTIAL' : 'OPEN') : 'PAID' })
      } else {
        const nextAmount = prev.amount + accAmount
        const nextReceived = prev.received_total + accReceived
        const nextRemaining = prev.remaining + accRemaining
        const status = nextRemaining > 0 ? (nextReceived > 0 ? 'PARTIAL' : 'OPEN') : 'PAID'
        map.set(key, { ...prev, amount: nextAmount, received_total: nextReceived, remaining: nextRemaining, status })
      }
    }
    let list = Array.from(map.values())
    // Sort
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortBy) {
        case 'amount': return (a.amount - b.amount) * dir
        case 'received_total': return (a.received_total - b.received_total) * dir
        case 'remaining': return (a.remaining - b.remaining) * dir
        case 'status': return (a.status.localeCompare(b.status)) * dir
        case 'customer_name':
        default: return (a.customer_name.localeCompare(b.customer_name)) * dir
      }
    })
    const totalItems = list.length
    const start = (page) * pageSize
    const end = start + pageSize
    const paged = list.slice(start, end)
    return { data: paged, count: totalItems }
  },

  async listByCustomerFiados(customerId: string) {
    // Fetch customer header
  const { data: cust, error: cErr } = await supabase.from('customers').select('id, full_name, email, phone, cep, street, number, complement, neighborhood, city, state').eq('id', customerId).maybeSingle()
    if (cErr) throw cErr
    // Fetch receivables linked to DIRECT_SALE for this customer
    const { data, error } = await supabase
      .from('receivables')
      .select('id, description, issue_date, amount, received_total, status, reference_type, reference_id, payments:receivable_payments(id, amount, method, received_at, notes)')
      .eq('customer_id', customerId)
      .eq('reference_type', 'DIRECT_SALE')
      .order('issue_date', { ascending: false })
    if (error) throw error
    const receivables = (data ?? []) as any[]
    const saleIds = receivables.map((r: any) => r.reference_id).filter((v: any) => !!v)
    let saleMap: Record<string, any> = {}
    if (saleIds.length) {
      const { data: sales, error: sErr } = await supabase
        .from('direct_sale_orders')
        .select('id, occurred_at, seller:seller_id(id, full_name, phone)')
        .in('id', saleIds)
      if (sErr) throw sErr
      saleMap = Object.fromEntries((sales ?? []).map((s: any) => [s.id, s]))
    }
    const enriched = receivables.map((r: any) => ({ ...r, sale: saleMap[r.reference_id ?? ''] ?? null }))
    return { data: { customer: cust, receivables: enriched } }
  },
}

export const apiPayables = {
  async listPaginated(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc'; status?: string; startDate?: string; endDate?: string }) {
    const { page, pageSize, query, sortBy = 'due_date', sortDir = 'asc', status, startDate, endDate } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    let q = supabase
      .from('payables')
      .select('*, supplier:supplier_id(name), payments:payable_payments(amount)', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

  if (status && status !== 'ALL') q = q.eq('status', status)
  if (startDate) q = q.gte('due_date', new Date(startDate).toISOString())
  if (endDate) q = q.lte('due_date', new Date(endDate).toISOString())
    if (query && query.trim()) q = q.or(`description.ilike.%${query}%,notes.ilike.%${query}%`)

    const { data, error, count } = await q
    if (error) throw error
    const rows = (data ?? []).map((r: any) => {
      const paid = Array.isArray(r.payments) ? r.payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) : Number(r.paid_total || 0)
      const remaining = Math.max(0, Number(r.amount || 0) - paid)
      return { ...r, supplier_name: r.supplier?.name ?? '-', paid_total: paid, remaining }
    })
    return { data: rows, count: count ?? 0 }
  },
  async create(input: { supplier_id?: string | null; description: string; issue_date?: string | null; due_date: string; amount: number; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const payload: any = {
      company_id: cid,
      supplier_id: input.supplier_id ?? null,
      description: input.description,
      issue_date: input.issue_date ? input.issue_date.slice(0, 10) : null,
      due_date: input.due_date.slice(0, 10),
      amount: Number(input.amount),
      notes: input.notes ?? null,
    }
    const { data, error } = await supabase.from('payables').insert(payload).select('*').single()
    if (error) throw error
    return data
  },
  async addPayment(input: { payable_id: string; amount: number; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; notes?: string | null; cash_session_id?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const amt = Math.abs(Number(input.amount))
    const { data: pay, error: recErr } = await supabase.from('payables').select('id, amount, paid_total').eq('id', input.payable_id).single()
    if (recErr) throw recErr
    const paid_total = Number((pay as any)?.paid_total || 0) + amt
    const total = Number((pay as any)?.amount || 0)
    const status = paid_total >= total ? 'PAID' : 'PARTIAL'
    const { error: payErr } = await supabase.from('payable_payments').insert({
      company_id: cid,
      payable_id: input.payable_id,
      amount: amt,
      method: input.method,
      notes: input.notes ?? null,
      cash_session_id: input.cash_session_id ?? null,
    })
    if (payErr) throw payErr
    const { error: updErr } = await supabase.from('payables').update({ paid_total, status }).eq('id', input.payable_id)
    if (updErr) throw updErr
    if (input.cash_session_id) {
      // create cash movement withdrawal categorized as supplier payment
      await apiCash.addExpense({ cash_session_id: input.cash_session_id, amount: amt, category: 'FORNECEDOR', method: input.method, notes: input.notes ?? 'Pagamento fornecedor' })
    }
    return true
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

// DASHBOARD METRICS
export const apiDashboard = {
  async getMonthlyOverview() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startIso = start.toISOString()
    const endIso = end.toISOString()

    // Previous month window
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevStartIso = prevStart.toISOString()
    const prevEndIso = prevEnd.toISOString()

    // Revenue (payments in current month)
    const paymentsPromise = supabase
      .from('payments')
      .select('amount, received_at')
      .gte('received_at', startIso)
      .lt('received_at', endIso)

    // Completed orders and avg ticket (DELIVERED in current month)
    const ordersPromise = supabase
      .from('service_orders')
      .select('id, total_amount, delivered_at, status')
      .eq('status', 'DELIVERED')
      .gte('delivered_at', startIso)
      .lt('delivered_at', endIso)

    // New customers count
    const customersPromise = supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startIso)
      .lt('created_at', endIso)

    // Previous month queries
    const prevPaymentsPromise = supabase
      .from('payments')
      .select('amount, received_at')
      .gte('received_at', prevStartIso)
      .lt('received_at', prevEndIso)

    const prevOrdersPromise = supabase
      .from('service_orders')
      .select('id, total_amount, delivered_at, status')
      .eq('status', 'DELIVERED')
      .gte('delivered_at', prevStartIso)
      .lt('delivered_at', prevEndIso)

    const prevCustomersPromise = supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', prevStartIso)
      .lt('created_at', prevEndIso)

    const [
      { data: payRows, error: payErr },
      { data: ordRows, error: ordErr },
      { count: custCount, error: custErr },
      { data: prevPayRows, error: prevPayErr },
      { data: prevOrdRows, error: prevOrdErr },
      { count: prevCustCount, error: prevCustErr },
    ] = await Promise.all([
      paymentsPromise,
      ordersPromise,
      customersPromise,
      prevPaymentsPromise,
      prevOrdersPromise,
      prevCustomersPromise,
    ])
    if (payErr) throw payErr
    if (ordErr) throw ordErr
    if (custErr) throw custErr
    if (prevPayErr) throw prevPayErr
    if (prevOrdErr) throw prevOrdErr
    if (prevCustErr) throw prevCustErr

    const revenue = (payRows ?? []).reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0)
    const completedOrders = (ordRows ?? []).length
    const avgTicket = completedOrders > 0 ? (ordRows ?? []).reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0) / completedOrders : 0
    const newCustomers = custCount ?? 0

    const prevRevenue = (prevPayRows ?? []).reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0)
    const prevCompletedOrders = (prevOrdRows ?? []).length
    const prevAvgTicket = prevCompletedOrders > 0 ? (prevOrdRows ?? []).reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0) / prevCompletedOrders : 0
    const prevNewCustomers = prevCustCount ?? 0

    return { revenue, completedOrders, newCustomers, avgTicket, prevRevenue, prevCompletedOrders, prevNewCustomers, prevAvgTicket }
  },
}

// SALES TIMESERIES (payments grouped by day)
export const apiSales = {
  async createDirectSale(input: { product_id: string; qty: number; unit_price: number; method: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'; customer_id?: string | null; cash_session_id?: string | null; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    const total = Number(input.qty) * Number(input.unit_price)
    const { data, error } = await supabase
      .from('direct_sales')
      .insert({
        company_id: cid,
        product_id: input.product_id,
        customer_id: input.customer_id ?? null,
        qty: input.qty,
        unit_price: input.unit_price,
        total,
        method: input.method,
        cash_session_id: input.cash_session_id ?? null,
        notes: input.notes ?? null,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },
  async createPosSale(input: { customer_id?: string | null; items: Array<{ product_id: string; qty: number; unit_price: number }>; payments: Array<{ method: 'CASH'|'CARD'|'PIX'|'TRANSFER'; amount: number; notes?: string | null }>; notes?: string | null }) {
    // Extend payments to accept FIADO logically (migration widens DB constraint)
    const cid = await getCompanyIdOrThrow()
    if (!input.items?.length) throw new Error('Nenhum item informado')
    const total = input.items.reduce((acc, it) => acc + Number(it.qty) * Number(it.unit_price), 0)
    // 1) criar sale order
  const uid = (await supabase.auth.getUser()).data.user?.id ?? null
  const { data: sale, error } = await supabase.from('direct_sale_orders').insert({ company_id: cid, customer_id: input.customer_id ?? null, total, notes: input.notes ?? null, seller_id: uid }).select('id').single()
    if (error) throw error
    const saleId = (sale as any).id as string
    // 2) itens
    const itemsPayload = input.items.map(it => ({ sale_id: saleId, product_id: it.product_id, qty: it.qty, unit_price: it.unit_price, total: Number(it.qty) * Number(it.unit_price) }))
    const { error: itemsErr } = await supabase.from('direct_sale_items').insert(itemsPayload)
    if (itemsErr) throw itemsErr
    // 3) baixa de estoque
    for (const it of input.items) {
      const qty = Number(it.qty)
      if (qty > 0) {
        const { error: invErr } = await supabase.from('inventory_movements').insert({ company_id: cid, product_id: it.product_id, type: 'OUT', qty, reason: 'Venda PDV', reference_id: saleId, reference_type: 'DIRECT_SALE' })
        if (invErr) throw invErr
      }
    }
  // 4) pagamentos
  let cashSessionId: string | null = null
  try { const s = await apiCash.getOpenSession(); cashSessionId = (s as any)?.id ?? null } catch { cashSessionId = null }
    const paysPayload = input.payments.map(p => ({ sale_id: saleId, method: p.method as any, amount: Number(p.amount), notes: p.notes ?? null, cash_session_id: (p.method === 'CASH' || p.method === 'CARD' || p.method === 'PIX' || p.method === 'TRANSFER') ? cashSessionId : null }))
    let insertedPays: Array<{ id: string; method: 'CASH'|'CARD'|'PIX'|'TRANSFER'; amount: number }> = []
    if (paysPayload.length) {
      const { data: paysData, error: payErr } = await supabase.from('direct_sale_payments').insert(paysPayload).select('id, method, amount')
      if (payErr) throw payErr
      insertedPays = (paysData ?? []) as any
    }
    // 5) gerar movimentos de caixa (somente métodos não-Fiado)
    if (cashSessionId && insertedPays.length) {
      for (const p of insertedPays) {
        if ((p as any).method !== 'FIADO') {
          const { error: movErr } = await supabase.from('cash_movements').insert({
            company_id: cid,
            cash_session_id: cashSessionId,
            type: 'DEPOSIT',
            amount: Number(p.amount),
            reference_type: 'PAYMENT',
            reference_id: p.id,
            method: (p as any).method,
            notes: 'Venda PDV',
          })
          if (movErr) throw movErr
        }
      }
    }

    // 6) criar recebível quando houver pagamento FIADO (sem vencimento)
    const fiadoTotal = input.payments.filter((p) => (p as any).method === 'FIADO').reduce((acc, p) => acc + Number(p.amount || 0), 0)
    if (fiadoTotal > 0) {
      const description = `Venda PDV`
      // Prefer due_date null; if DB still has NOT NULL, fallback to a distant future date
      const supportsNullDue = true // set by migration 0038; if not applied, server will error
      const payload: any = {
        customer_id: input.customer_id ?? null,
        description,
        issue_date: new Date().toISOString().slice(0,10),
        due_date: supportsNullDue ? null : new Date(8640000000000000).toISOString().slice(0,10),
        amount: fiadoTotal,
        notes: 'Gerado automaticamente por venda PDV (fiado)',
        reference_type: 'DIRECT_SALE',
        reference_id: saleId,
      }
      await apiReceivables.create(payload)
      // Futuro: atrelar recebível à venda por referência
    }
    return { id: saleId }
  },
  async updatePosSale(id: string, input: { customer_id?: string | null; items: Array<{ product_id: string; qty: number; unit_price: number }>; payments: Array<{ method: 'CASH'|'CARD'|'PIX'|'TRANSFER'; amount: number; notes?: string | null }>; notes?: string | null }) {
    const cid = await getCompanyIdOrThrow()
    // Load existing sale with items
    const existing = await this.getPosSale(id)
    if (!existing) throw new Error('Venda não encontrada')

    const total = input.items.reduce((acc, it) => acc + Number(it.qty) * Number(it.unit_price), 0)

    // Compute inventory delta per product
    const sumBy = (arr: any[]) => {
      const m = new Map<string, number>()
      for (const it of arr) {
        const pid = it.product_id as string
        const qty = Number(it.qty)
        m.set(pid, (m.get(pid) ?? 0) + qty)
      }
      return m
    }
    const oldMap = sumBy(existing.items ?? [])
    const newMap = sumBy(input.items)
    const allPids = new Set<string>([...Array.from(oldMap.keys()), ...Array.from(newMap.keys())])

    // 1) Update order header
    const { error: updErr } = await supabase
      .from('direct_sale_orders')
      .update({ customer_id: input.customer_id ?? null, total, notes: input.notes ?? null })
      .eq('id', id)
    if (updErr) throw updErr

    // 2) Replace items
    const { error: delItemsErr } = await supabase.from('direct_sale_items').delete().eq('sale_id', id)
    if (delItemsErr) throw delItemsErr
    const itemsPayload = input.items.map(it => ({ sale_id: id, product_id: it.product_id, qty: Number(it.qty), unit_price: Number(it.unit_price), total: Number(it.qty) * Number(it.unit_price) }))
    if (itemsPayload.length) {
      const { error: insItemsErr } = await supabase.from('direct_sale_items').insert(itemsPayload)
      if (insItemsErr) throw insItemsErr
    }

    // 3) Adjust inventory based on delta (OUT for increase, IN for decrease)
    for (const pid of allPids) {
      const before = oldMap.get(pid) ?? 0
      const after = newMap.get(pid) ?? 0
      const delta = after - before
      if (delta === 0) continue
      if (delta > 0) {
        const { error: invErr } = await supabase.from('inventory_movements').insert({ company_id: cid, product_id: pid, type: 'OUT', qty: delta, reason: 'Ajuste venda PDV', reference_id: id, reference_type: 'DIRECT_SALE' })
        if (invErr) throw invErr
      } else {
        const { error: invErr } = await supabase.from('inventory_movements').insert({ company_id: cid, product_id: pid, type: 'IN', qty: Math.abs(delta), reason: 'Ajuste venda PDV', reference_id: id, reference_type: 'DIRECT_SALE' })
        if (invErr) throw invErr
      }
    }

  // 4) Replace payments and reconcile cash movements / receivables
    // 4a) Remove cash movements linked to existing payments
    const { data: oldPays, error: listOldPaysErr } = await supabase.from('direct_sale_payments').select('id').eq('sale_id', id)
    if (listOldPaysErr) throw listOldPaysErr
    const oldPayIds = (oldPays ?? []).map((r: any) => r.id)
    if (oldPayIds.length) {
      const { error: delMovErr } = await supabase
        .from('cash_movements')
        .delete()
        .eq('reference_type', 'PAYMENT')
        .in('reference_id', oldPayIds)
      if (delMovErr) throw delMovErr
    }
    // 4b) Delete existing payments
    const { error: delPaysErr } = await supabase.from('direct_sale_payments').delete().eq('sale_id', id)
    if (delPaysErr) throw delPaysErr
    // 4c) Insert new payments
    // Try to attach to current open cash session
    let cashSessionId: string | null = null
    try { const s = await apiCash.getOpenSession(); cashSessionId = (s as any)?.id ?? null } catch { cashSessionId = null }
    const paysPayload = input.payments.map(p => ({ sale_id: id, method: p.method as any, amount: Number(p.amount), notes: p.notes ?? null, cash_session_id: (p.method === 'CASH' || p.method === 'CARD' || p.method === 'PIX' || p.method === 'TRANSFER') ? cashSessionId : null }))
    let newPays: Array<{ id: string; method: 'CASH'|'CARD'|'PIX'|'TRANSFER'; amount: number }> = []
    if (paysPayload.length) {
      const { data: paysData, error: insPaysErr } = await supabase.from('direct_sale_payments').insert(paysPayload).select('id, method, amount')
      if (insPaysErr) throw insPaysErr
      newPays = (paysData ?? []) as any
    }
    // 4d) Create new cash movements referencing those payments if session exists (skip FIADO)
    if (cashSessionId && newPays.length) {
      for (const p of newPays) {
        if ((p as any).method !== 'FIADO') {
          const { error: movErr } = await supabase.from('cash_movements').insert({
            company_id: cid,
            cash_session_id: cashSessionId,
            type: 'DEPOSIT',
            amount: Number(p.amount),
            reference_type: 'PAYMENT',
            reference_id: p.id,
            method: (p as any).method,
            notes: 'Venda PDV (edição)',
          })
          if (movErr) throw movErr
        }
      }
    }

    // 4e) Manage receivables for FIADO on edit: create with no due date
    const fiadoTotal = input.payments.filter((p) => (p as any).method === 'FIADO').reduce((acc, p) => acc + Number(p.amount || 0), 0)
    if (fiadoTotal > 0) {
      const description = `Venda PDV`
      const supportsNullDue2 = true
      const payload2: any = {
        customer_id: input.customer_id ?? null,
        description,
        issue_date: new Date().toISOString().slice(0,10),
        due_date: supportsNullDue2 ? null : new Date(8640000000000000).toISOString().slice(0,10),
        amount: fiadoTotal,
        notes: 'Gerado automaticamente por edição da venda PDV (fiado)',
        reference_type: 'DIRECT_SALE',
        reference_id: id,
      }
      await apiReceivables.create(payload2)
    }

    return { id }
  },
  async listPosSales(params: { page: number; pageSize: number; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, sortBy = 'occurred_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
  .from('direct_sale_orders')
  .select('*, customer:customer_id(id,full_name,phone), seller:seller_id(id,full_name,phone), payments:direct_sale_payments(method,amount)')
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async getPosSale(id: string) {
    // Fetch sale with customer, items (with product details), and payments
    const { data, error } = await supabase
      .from('direct_sale_orders')
      .select(`
        id, company_id, customer_id, total, occurred_at, notes,
        customer:customer_id(id, full_name, phone),
        seller:seller_id(id, full_name, phone),
        items:direct_sale_items(*, product:product_id(id, sku, name, unit_price)),
        payments:direct_sale_payments(id, method, amount, cash_session_id, notes)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as any
  },
  async removePosSale(id: string) {
    // First, delete any cash movements linked to this sale's payments, then restore inventory, remove receivables (FIADO), and finally delete the sale
    const { data: pays, error: paysErr } = await supabase
      .from('direct_sale_payments')
      .select('id')
      .eq('sale_id', id)
    if (paysErr) throw paysErr
    const payIds = (pays ?? []).map((r: any) => r.id)
    if (payIds.length) {
      const { error: delMovErr } = await supabase
        .from('cash_movements')
        .delete()
        .eq('reference_type', 'PAYMENT')
        .in('reference_id', payIds)
      if (delMovErr) throw delMovErr
    }

    // Restore inventory: add IN movements for each item of the sale
    const cid = await getCompanyIdOrThrow()
    const { data: items, error: itemsErr } = await supabase
      .from('direct_sale_items')
      .select('product_id, qty')
      .eq('sale_id', id)
    if (itemsErr) throw itemsErr
    for (const it of (items ?? [])) {
      const qty = Number((it as any).qty || 0)
      if (qty > 0) {
        const { error: invErr } = await supabase.from('inventory_movements').insert({ company_id: cid, product_id: (it as any).product_id, type: 'IN', qty, reason: 'Estorno venda PDV', reference_id: id, reference_type: 'DIRECT_SALE' })
        if (invErr) throw invErr
      }
    }

    // Remove receivables linked to this sale (FIADO)
    const { error: delRecErr } = await supabase
      .from('receivables')
      .delete()
      .eq('reference_type', 'DIRECT_SALE')
      .eq('reference_id', id)
    if (delRecErr) throw delRecErr

    const { error } = await supabase.from('direct_sale_orders').delete().eq('id', id)
    if (error) throw error
    return true
  },
  async listDirectSales(params: { page: number; pageSize: number; query?: string; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, sortBy = 'occurred_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
      .from('direct_sales')
      .select('*, product:product_id(sku,name) , customer:customer_id(full_name) ', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async listDirectSalesByCustomer(customerId: string, params: { page: number; pageSize: number; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
    const { page, pageSize, sortBy = 'occurred_at', sortDir = 'desc' } = params
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
      .from('direct_sales')
      .select('*, product:product_id(sku,name)')
      .eq('customer_id', customerId)
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },
  async getSalesTimeseries(range: '7d' | '30d' | '90d') {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90

    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)

    const startIso = start.toISOString()
    const endIso = end.toISOString()

    const { data: payRows, error } = await supabase
      .from('payments')
      .select('id, amount, received_at, service_order_id')
      .gte('received_at', startIso)
      .lte('received_at', endIso)
      .order('received_at', { ascending: true })
    if (error) throw error

    // Initialize days with zero totals
    const series: { [date: string]: { total: number; products: number; os: number } } = {}
    const iter = new Date(start)
    while (iter <= end) {
      const key = iter.toISOString().slice(0, 10)
      series[key] = { total: 0, products: 0, os: 0 }
      iter.setDate(iter.getDate() + 1)
    }

    const payments = (payRows ?? []) as Array<{ id: string; amount: number; received_at: string; service_order_id: string | null }>

    // Fetch related orders and items for breakdown allocation
    const orderIds = Array.from(new Set(payments.map(p => p.service_order_id).filter(Boolean))) as string[]
    let productsTotalsByOrder: Record<string, number> = {}
    let laborTotalsByOrder: Record<string, number> = {}
    let orderTotalsByOrder: Record<string, number> = {}
    if (orderIds.length > 0) {
      const { data: orders, error: ordersErr } = await supabase
        .from('service_orders')
        .select('id, labor_price, total_amount')
        .in('id', orderIds)
      if (ordersErr) throw ordersErr
      for (const o of orders ?? []) {
        laborTotalsByOrder[o.id as string] = Number((o as any).labor_price || 0)
        orderTotalsByOrder[o.id as string] = Number((o as any).total_amount || 0)
      }
      const { data: items, error: itemsErr } = await supabase
        .from('service_order_items')
        .select('service_order_id, total')
        .in('service_order_id', orderIds)
      if (itemsErr) throw itemsErr
      for (const it of items ?? []) {
        const oid = it.service_order_id as string
        productsTotalsByOrder[oid] = (productsTotalsByOrder[oid] || 0) + Number((it as any).total || 0)
      }
    }

    // Aggregate payments by day with allocation to products vs os
    for (const row of payments) {
      const d = new Date(row.received_at)
      const key = d.toISOString().slice(0, 10)
      const amount = Number(row.amount || 0)
      if (!(key in series)) continue
      series[key].total += amount
      if (row.service_order_id) {
        const oid = row.service_order_id
        const orderTotal = orderTotalsByOrder[oid] || 0
        const productsTotal = productsTotalsByOrder[oid] || 0
        const laborTotal = laborTotalsByOrder[oid] || 0
        if (orderTotal > 0) {
          const prodShare = amount * (productsTotal / orderTotal)
          const osShare = amount * (laborTotal / orderTotal)
          series[key].products += prodShare
          series[key].os += osShare
        } else {
          // if no total, allocate to OS by default
          series[key].os += amount
        }
      }
    }

    // Build array sorted by date
    const result = Object.entries(series)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, v]) => ({ date, total: v.total, products: v.products, os: v.os }))

    return result
  },
  async listRecentSales(limit = 10) {
    // Join payments -> service_orders -> customers, users (technician)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        method,
        received_at,
        service_order:service_orders(id, ticket_number, customer:customers(full_name), technician:users(full_name))
      `)
      .order('received_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount || 0),
      method: p.method,
      received_at: p.received_at,
      ticket_number: p.service_order?.ticket_number ?? '-',
      customer_name: p.service_order?.customer?.full_name ?? '-',
      technician_name: p.service_order?.technician?.full_name ?? '-',
    }))
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

// REMINDERS
export const apiReminders = {
  async getLowStock(limit = 20) {
    // Use products_with_stock view to get current stock_qty; filter by stock_qty <= reorder_level
    const { data, error } = await supabase
      .from('products_with_stock')
      .select('id, sku, name, stock_qty, reorder_level')
      .order('stock_qty', { ascending: true })
      .limit(limit)
    if (error) throw error
    const rows = (data ?? []) as Array<any>
    return rows.filter(r => Number(r.stock_qty ?? 0) <= Number(r.reorder_level ?? 0))
  },
  async getUpcomingBirthdays(daysAhead = 14) {
    // Collect from customers, users (employees), and technicians
    const now = new Date()
    const target = new Date(now)
    target.setDate(target.getDate() + daysAhead)

    function withinWindow(dateStr?: string | null) {
      if (!dateStr) return false
      const d = new Date(dateStr)
      const mm = d.getMonth(); const dd = d.getDate()
      const y = now.getFullYear()
      const thisYear = new Date(y, mm, dd)
      const nextYear = new Date(y + 1, mm, dd)
      // choose the next occurrence from today
      const next = thisYear >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? thisYear : nextYear
      return next <= target
    }

    const [customers, users] = await Promise.all([
      supabase.from('customers').select('id, full_name, birth_date').is('deleted_at', null),
      supabase.from('users').select('id, full_name, birth_date'),
    ])

    const list: Array<{ id: string; full_name: string; birth_date: string; type: 'customer' | 'employee' | 'technician' }> = []
    for (const c of (customers.data ?? [])) {
      if (withinWindow((c as any).birth_date)) list.push({ id: (c as any).id, full_name: (c as any).full_name, birth_date: (c as any).birth_date, type: 'customer' })
    }
    for (const u of (users.data ?? [])) {
      if (withinWindow((u as any).birth_date)) list.push({ id: (u as any).id, full_name: (u as any).full_name ?? '-', birth_date: (u as any).birth_date, type: 'employee' })
    }
    // technicians birth_date not guaranteed; skip if absent
    // Optionally, if technicians had a birth_date column, you could include similar logic.

    // sort by upcoming date
    list.sort((a, b) => {
      const ad = new Date(a.birth_date); const bd = new Date(b.birth_date)
      const ay = now.getFullYear(); const by = now.getFullYear()
      const an = new Date(ay, ad.getMonth(), ad.getDate())
      const bn = new Date(by, bd.getMonth(), bd.getDate())
      return an.getTime() - bn.getTime()
    })
    return list
  },
  async getOrdersDueSoon(daysAhead = 3) {
    // Orders not delivered/cancelled with due_date within window
    const now = new Date()
    const startIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = new Date(now)
    end.setDate(end.getDate() + daysAhead)
    const endIso = end.toISOString()

    const { data, error } = await supabase
      .from('service_orders')
      .select('id, ticket_number, due_date, status, customer:customer_id(full_name)')
      .not('status', 'in', '(DELIVERED,CANCELLED)')
      .gte('due_date', startIso)
      .lte('due_date', endIso)
      .order('due_date', { ascending: true })
    if (error) throw error

    const rows = (data ?? []) as Array<any>
    return rows.map((r) => {
      const due = new Date(r.due_date)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffMs = due.getTime() - today.getTime()
      const days_left = Math.round(diffMs / (24 * 60 * 60 * 1000))
      return { id: r.id as string, ticket_number: r.ticket_number as string, due_date: r.due_date as string, days_left, customer_name: r.customer?.full_name ?? '-' }
    })
  },
  async getReceivablesDueSoon(daysAhead = 7) {
    const now = new Date()
    const startIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = new Date(now)
    end.setDate(end.getDate() + daysAhead)
    const endIso = end.toISOString()

    const { data, error } = await supabase
      .from('receivables')
      .select('id, customer:customer_id(full_name), due_date, amount, received_total, description, status')
      .in('status', ['OPEN','PARTIAL'])
      .gte('due_date', startIso)
      .lte('due_date', endIso)
      .order('due_date', { ascending: true })
    if (error) throw error
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return (data ?? []).map((r: any) => {
      const due = new Date(r.due_date)
      const days_left = Math.round((due.getTime() - today.getTime()) / (24*60*60*1000))
      const remaining = Math.max(0, Number(r.amount || 0) - Number(r.received_total || 0))
      return { id: r.id as string, customer_name: r.customer?.full_name ?? '-', due_date: r.due_date as string, days_left, remaining, description: r.description as string }
    })
  },
  async getPayablesDueSoon(daysAhead = 7) {
    const now = new Date()
    const startIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = new Date(now)
    end.setDate(end.getDate() + daysAhead)
    const endIso = end.toISOString()

    const { data, error } = await supabase
      .from('payables')
      .select('id, supplier:supplier_id(name), due_date, amount, paid_total, description, status')
      .in('status', ['OPEN','PARTIAL'])
      .gte('due_date', startIso)
      .lte('due_date', endIso)
      .order('due_date', { ascending: true })
    if (error) throw error
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return (data ?? []).map((r: any) => {
      const due = new Date(r.due_date)
      const days_left = Math.round((due.getTime() - today.getTime()) / (24*60*60*1000))
      const remaining = Math.max(0, Number(r.amount || 0) - Number(r.paid_total || 0))
      return { id: r.id as string, supplier_name: r.supplier?.name ?? '-', due_date: r.due_date as string, days_left, remaining, description: r.description as string }
    })
  },
}

// MARKETING
export const apiMarketing = {
  async createLead(email: string, meta?: Record<string, any>) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail inválido')
    const { data, error } = await supabase
      .from('leads')
      .insert({ email: email.trim().toLowerCase(), meta: meta ?? null })
      .select('*')
      .single()
    if (error) throw error
    return data
  },
}
