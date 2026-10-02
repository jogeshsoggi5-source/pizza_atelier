import { supabase } from './supabase'

// ============================================
// MENU ITEMS QUERIES
// ============================================

export const getMenuItems = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category', { ascending: true })

  return { data, error }
}

export const getMenuItemsByCategory = async (category: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category', category)
    .eq('is_available', true)

  return { data, error }
}

export const getSignaturePizzas = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_signature', true)
    .eq('category', 'pizza')

  return { data, error }
}

export const getMenuItem = async (id: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

// ============================================
// CUSTOMER QUERIES
// ============================================

export const getOrCreateCustomer = async (email: string, name: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  // Check if customer exists
  const { data: existing, error: checkError } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single()

  if (existing) {
    return { data: existing, error: null }
  }

  // Create new customer
  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert([{ email, name }])
    .select()
    .single()

  return { data: newCustomer, error: createError }
}

export const getCustomer = async (email: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single()

  return { data, error }
}

export const updateCustomer = async (id: string, updates: any) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

// ============================================
// ORDER QUERIES
// ============================================

export interface OrderLine {
  name: string
  size?: string
  extras?: string[]
  qty: number
  unit_price: number
}

/**
 * Places an order from the public site. Visitors may insert but not read orders
 * (see supabase/admin_migration.sql), so nothing is selected back.
 */
export const placeOrder = async (order: {
  order_number: string
  customer_name: string
  customer_phone: string
  items: OrderLine[]
  total_amount: number
  delivery_fee: number
  grand_total: number
  fulfillment_type: 'delivery' | 'pickup'
  delivery_address?: string
}) => {
  if (!supabase) return { error: new Error('Supabase not configured') }

  const { error } = await supabase
    .from('orders')
    .insert([{ ...order, status: 'pending' }])

  return { error }
}

export const createOrderItems = async (items: {
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  subtotal: number
  special_instructions?: string
}[]) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select()

  return { data, error }
}

export const getOrder = async (orderId: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        menu_items(*)
      )
    `)
    .eq('id', orderId)
    .single()

  return { data, error }
}

export const getCustomerOrders = async (customerId: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        menu_items(*)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const updateOrderStatus = async (orderId: string, status: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date() })
    .eq('id', orderId)
    .select()
    .single()

  return { data, error }
}

// ============================================
// RESERVATION QUERIES
// ============================================

export const createReservation = async (reservationData: {
  customer_name: string
  customer_email: string
  customer_phone?: string
  reservation_date: string
  reservation_time: string
  party_size: number
  special_requests?: string
  status?: string
}) => {
  if (!supabase) return { error: new Error('Supabase not configured') }

  const { error } = await supabase
    .from('reservations')
    .insert([{
      ...reservationData,
      status: reservationData.status || 'pending',
    }])

  return { error }
}

export const getReservations = async (filters?: {
  reservationDate?: string
  status?: string
}) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  let query = supabase.from('reservations').select('*')

  if (filters?.reservationDate) {
    query = query.eq('reservation_date', filters.reservationDate)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query.order('reservation_date', { ascending: true })

  return { data, error }
}

export const updateReservation = async (id: string, updates: any) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

// ============================================
// CONTACT MESSAGE QUERIES
// ============================================

export const saveContactMessage = async (messageData: {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  message_type?: string
}) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('contact_messages')
    .insert([{
      ...messageData,
      status: 'new',
    }])
    .select()
    .single()

  return { data, error }
}

export const getContactMessages = async (filters?: {
  status?: string
  email?: string
}) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  let query = supabase.from('contact_messages').select('*')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.email) {
    query = query.eq('email', filters.email)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  return { data, error }
}

export const updateContactMessage = async (id: string, updates: any) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('contact_messages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

// ============================================
// GALLERY QUERIES
// ============================================

export const getGalleryItems = async (category?: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  let query = supabase.from('gallery_items').select('*')

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.order('sort_order', { ascending: true })

  return { data, error }
}

// ============================================
// REVIEWS QUERIES
// ============================================

export const createReview = async (reviewData: {
  customer_id: string
  order_id?: string
  rating: number
  title?: string
  comment?: string
}) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('reviews')
    .insert([reviewData])
    .select()
    .single()

  return { data, error }
}

export const getReviews = async (limit = 10) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error }
}

export const getAverageRating = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')

  if (error || !data || data.length === 0) {
    return { data: 0, error }
  }

  const average = data.reduce((sum: number, row: { rating: number }) => sum + row.rating, 0) / data.length
  return { data: Math.round(average * 10) / 10, error: null }
}
