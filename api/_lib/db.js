import supabase from './db-client.js';
import { skuKey } from './inventory.js';

function isUniqueViolation(error) {
  return error?.code === '23505' || /duplicate|unique/i.test(error?.message || '');
}

export function createSupabaseDb(client = supabase) {
  return {
    async getOrder(id) {
      const { data, error } = await client.from('orders').select('*').eq('id', Number(id)).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getOrderByNumber(orderNumber) {
      const { data, error } = await client.from('orders').select('*').eq('order_number', orderNumber).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getOrderByIdempotency(key) {
      const { data, error } = await client.from('checkout_idempotency').select('*').eq('key', key).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return this.getOrder(data.order_id);
    },
    async insertIdempotency(row) {
      const { data, error } = await client.from('checkout_idempotency').insert(row).select().maybeSingle();
      if (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
      }
      return data;
    },
    async insertOrder(row) {
      const { data, error } = await client.from('orders').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async updateOrder(id, version, patch) {
      const { data, error } = await client.from('orders').update(patch).eq('id', Number(id)).eq('version', version).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    async insertOrderItems(rows) {
      const { data, error } = await client.from('order_items').insert(rows).select();
      if (error) throw error;
      return data;
    },
    async getOrderItems(orderId) {
      const { data, error } = await client.from('order_items').select('*').eq('order_id', Number(orderId)).order('id');
      if (error) throw error;
      return data || [];
    },
    async listOrders({ userId, admin, id, paymentStatus } = {}) {
      let query = client.from('orders').select('*').order('created_at', { ascending: false });
      if (!admin && userId) query = query.eq('user_id', userId);
      if (id) query = query.eq('id', Number(id));
      if (paymentStatus) query = query.eq('payment_status', paymentStatus);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async listPendingOrders(beforeIso) {
      let query = client.from('orders').select('*').eq('payment_status', 'PAYMENT_PENDING').order('created_at', { ascending: true }).limit(50);
      if (beforeIso) query = query.lte('created_at', beforeIso);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async getInventory(key) {
      const keys = [key];
      if (typeof key === 'string') {
        if (key.includes(':')) keys.push(key.replace(':', '_'));
        if (key.includes('_')) keys.push(key.replace('_', ':'));
      }
      const { data, error } = await client.from('inventory').select('*').in('sku_key', keys).maybeSingle();
      if (error) throw error;
      return data;
    },
    async updateInventory(key, version, patch) {
      const keys = [key];
      if (typeof key === 'string') {
        if (key.includes(':')) keys.push(key.replace(':', '_'));
        if (key.includes('_')) keys.push(key.replace('_', ':'));
      }
      const { data, error } = await client.from('inventory').update(patch).in('sku_key', keys).eq('version', version).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    async upsertInventory(row) {
      const { data, error } = await client.from('inventory').upsert(row, { onConflict: 'sku_key' }).select().single();
      if (error) throw error;
      return data;
    },
    async listInventoryForProduct(productId) {
      const { data, error } = await client.from('inventory').select('*').eq('product_id', Number(productId));
      if (error) throw error;
      return data || [];
    },
    async syncProductStock(productId) {
      const rows = await this.listInventoryForProduct(productId);
      const stock = {};
      for (const row of rows) {
        stock[row.size] = Math.max(0, Number(row.quantity) - Number(row.reserved));
      }
      const { error } = await client.from('products').update({ stock }).eq('id', Number(productId));
      if (error) throw error;
    },
    async getProduct(id) {
      const { data, error } = await client.from('products').select('*').eq('id', Number(id)).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getProducts(ids) {
      const { data, error } = await client.from('products').select('*').in('id', ids);
      if (error) throw error;
      return data || [];
    },
    async claimPaymentId(row) {
      const { data, error } = await client.from('cf_payment_map').insert(row).select().maybeSingle();
      if (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
      }
      return data;
    },
    async insertCfOrderMap(row) {
      const { data, error } = await client.from('cf_order_map').insert(row).select().maybeSingle();
      if (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
      }
      return data;
    },
    async getOrderByCfOrderId(cfOrderId) {
      const { data, error } = await client.from('cf_order_map').select('*').eq('cf_order_id', cfOrderId).maybeSingle();
      if (error) throw error;
      return data ? this.getOrder(data.order_id) : null;
    },
    async insertPayment(row) {
      const { data, error } = await client.from('payments').insert(row).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    async listPayments(orderId) {
      const { data, error } = await client.from('payments').select('*').eq('order_id', Number(orderId)).order('id');
      if (error) throw error;
      return data || [];
    },
    async listAllPayments() {
      const { data, error } = await client.from('payments').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
    async insertAttempt(row) {
      const { data, error } = await client.from('payment_attempts').insert(row).select().maybeSingle();
      if (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
      }
      return data;
    },
    async listAttempts(orderId) {
      const { data, error } = await client.from('payment_attempts').select('*').eq('order_id', Number(orderId)).order('id');
      if (error) throw error;
      return data || [];
    },
    async insertWebhookEvent(row) {
      const { data, error } = await client.from('webhook_events').insert(row).select().maybeSingle();
      if (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
      }
      return data;
    },
    async listWebhookEvents(orderNumber) {
      let query = client.from('webhook_events').select('*').order('created_at', { ascending: false }).limit(200);
      if (orderNumber) query = query.eq('order_id', orderNumber);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async insertRefund(row) {
      const { data, error } = await client.from('refunds').insert(row).select().maybeSingle();
      if (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
      }
      return data;
    },
    async updateRefund(refundId, patch) {
      const { data, error } = await client.from('refunds').update(patch).eq('refund_id', refundId).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    async getRefundById(refundId) {
      const { data, error } = await client.from('refunds').select('*').eq('refund_id', refundId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getRefundByCfId(cfRefundId) {
      const { data, error } = await client.from('refunds').select('*').eq('cf_refund_id', cfRefundId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async listRefunds(orderId) {
      const { data, error } = await client.from('refunds').select('*').eq('order_id', Number(orderId)).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async listAllRefunds() {
      const { data, error } = await client.from('refunds').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
    async sumSuccessfulRefunds(orderId) {
      const rows = await this.listRefunds(orderId);
      return rows.filter((row) => row.status === 'SUCCESS').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    },
    async insertAudit(row) {
      const { error } = await client.from('audit_logs').insert(row);
      if (error) throw error;
    },
    async listAudit(orderId) {
      const { data, error } = await client.from('audit_logs').select('*').eq('order_id', Number(orderId)).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
    skuKey,
  };
}

export default createSupabaseDb();
