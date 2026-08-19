export interface Product {
  id: number;
  brand: string;
  brand_slug: string;
  name: string;
  slug: string;
  category: string;
  category_slug: string;
  description: string;
  images: string[];
  specifications: Record<string, string>;
  mrp: number;
  sale_price: number;
  discount: number;
  sizes: string[];
  stock: Record<string, number>;
  gender: string;
  featured: boolean;
  popularity: number;
  created_at: string;
  wishlist_id?: number;
  preferred_size?: string;
}

export interface Brand { id: number; name: string; slug: string; description: string; product_count?: number; hero_image?: string; active: boolean; }
export interface Category { id: number; name: string; slug: string; description: string; image: string; active: boolean; }
export interface CartItem { product: Product; size: string; quantity: number; }
export interface Address { id?: number; label: string; full_name: string; phone: string; line1: string; line2: string; city: string; state: string; postal_code: string; is_default: boolean; }
export interface OrderItem { id?: number; product_id: number; brand: string; product_name: string; image: string; size: string; quantity: number; mrp: number; sale_price: number; }

export type PaymentStatus = 'CREATED' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type FulfillmentStatus = 'Pending' | 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Payment {
  id: number;
  order_id: number;
  status: string;
  amount: number;
  currency: string;
  method: string;
  cf_order_id?: string;
  cf_payment_id?: string;
  payment_message?: string;
  bank_reference?: string;
  source?: string;
  created_at: string;
}

export interface Refund {
  id?: number;
  refund_id: string;
  order_id: number;
  amount: number;
  currency: string;
  status: string;
  cf_refund_id?: string;
  reason?: string;
  created_at: string;
}

export interface WebhookEvent {
  id: number;
  dedup_key: string;
  event_type: string;
  order_id?: string;
  cf_payment_id?: string;
  cf_refund_id?: string;
  signature_valid: boolean;
  source: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: FulfillmentStatus;
  created_at: string;
  mrp_total: number;
  discount_total: number;
  shipping_total: number;
  total: number;
  currency?: string;
  payment_method: string;
  payment_status: PaymentStatus | string;
  payment_session_id?: string;
  cf_order_id?: string;
  cf_environment?: string;
  paid_at?: string;
  failure_reason?: string;
  address: Address;
  items: OrderItem[];
  payments?: Payment[];
  refunds?: Refund[];
  customer_name?: string;
  email?: string;
  phone?: string;
}

export interface Profile { id: string; email: string; full_name: string; phone: string; role: 'customer' | 'admin'; created_at: string; }
