function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createMemoryDb(seed = {}) {
  const state = {
    orders: [],
    orderItems: [],
    inventory: [],
    products: [],
    payments: [],
    attempts: [],
    webhooks: [],
    refunds: [],
    audit: [],
    idempotency: [],
    cfOrders: [],
    cfPayments: [],
    nextId: 1,
    ...clone(seed),
  };

  const nextId = () => state.nextId++;

  return {
    state,
    async getOrder(id) {
      return clone(state.orders.find((row) => row.id === Number(id)) || null);
    },
    async getOrderByNumber(orderNumber) {
      return clone(state.orders.find((row) => row.order_number === orderNumber) || null);
    },
    async getOrderByIdempotency(key) {
      const hit = state.idempotency.find((row) => row.key === key);
      return hit ? this.getOrder(hit.order_id) : null;
    },
    async insertIdempotency(row) {
      if (state.idempotency.some((entry) => entry.key === row.key)) return null;
      state.idempotency.push({ ...row });
      return clone(row);
    },
    async insertOrder(row) {
      const order = { id: nextId(), version: 1, ...row };
      state.orders.push(order);
      return clone(order);
    },
    async updateOrder(id, version, patch) {
      const row = state.orders.find((entry) => entry.id === Number(id) && entry.version === version);
      if (!row) return null;
      Object.assign(row, patch);
      return clone(row);
    },
    async insertOrderItems(rows) {
      const inserted = rows.map((row) => ({ id: nextId(), ...row }));
      state.orderItems.push(...inserted);
      return clone(inserted);
    },
    async getOrderItems(orderId) {
      return clone(state.orderItems.filter((row) => row.order_id === Number(orderId)));
    },
    async listOrders() {
      return clone(state.orders);
    },
    async listPendingOrders() {
      return clone(state.orders.filter((row) => row.payment_status === 'PAYMENT_PENDING'));
    },
    async getInventory(key) {
      return clone(state.inventory.find((row) => row.sku_key === key) || null);
    },
    async updateInventory(key, version, patch) {
      const row = state.inventory.find((entry) => entry.sku_key === key && entry.version === version);
      if (!row) return null;
      Object.assign(row, patch);
      return clone(row);
    },
    async upsertInventory(row) {
      const existing = state.inventory.find((entry) => entry.sku_key === row.sku_key);
      if (existing) Object.assign(existing, row);
      else state.inventory.push({ ...row });
      return clone(row);
    },
    async listInventoryForProduct(productId) {
      return clone(state.inventory.filter((row) => row.product_id === Number(productId)));
    },
    async syncProductStock(productId) {
      const product = state.products.find((row) => row.id === Number(productId));
      if (!product) return;
      product.stock = {};
      for (const row of state.inventory.filter((entry) => entry.product_id === Number(productId))) {
        product.stock[row.size] = Math.max(0, Number(row.quantity) - Number(row.reserved));
      }
    },
    async getProduct(id) {
      return clone(state.products.find((row) => row.id === Number(id)) || null);
    },
    async getProducts(ids) {
      return clone(state.products.filter((row) => ids.includes(row.id)));
    },
    async claimPaymentId(row) {
      if (state.cfPayments.some((entry) => entry.cf_payment_id === row.cf_payment_id)) return null;
      state.cfPayments.push({ ...row });
      return clone(row);
    },
    async insertCfOrderMap(row) {
      if (state.cfOrders.some((entry) => entry.cf_order_id === row.cf_order_id)) return null;
      state.cfOrders.push({ ...row });
      return clone(row);
    },
    async getOrderByCfOrderId(cfOrderId) {
      const hit = state.cfOrders.find((row) => row.cf_order_id === cfOrderId);
      return hit ? this.getOrder(hit.order_id) : null;
    },
    async insertPayment(row) {
      const payment = { id: nextId(), ...row };
      state.payments.push(payment);
      return clone(payment);
    },
    async listPayments(orderId) {
      return clone(state.payments.filter((row) => row.order_id === Number(orderId)));
    },
    async insertAttempt(row) {
      const attempt = { id: nextId(), ...row };
      state.attempts.push(attempt);
      return clone(attempt);
    },
    async insertWebhookEvent(row) {
      if (state.webhooks.some((entry) => entry.dedup_key === row.dedup_key)) return null;
      const event = { id: nextId(), ...row };
      state.webhooks.push(event);
      return clone(event);
    },
    async insertRefund(row) {
      if (state.refunds.some((entry) => entry.refund_id === row.refund_id)) return null;
      const refund = { id: nextId(), ...row };
      state.refunds.push(refund);
      return clone(refund);
    },
    async updateRefund(refundId, patch) {
      const row = state.refunds.find((entry) => entry.refund_id === refundId);
      if (!row) return null;
      Object.assign(row, patch);
      return clone(row);
    },
    async getRefundById(refundId) {
      return clone(state.refunds.find((row) => row.refund_id === refundId) || null);
    },
    async getRefundByCfId(cfRefundId) {
      return clone(state.refunds.find((row) => row.cf_refund_id === cfRefundId) || null);
    },
    async listRefunds(orderId) {
      return clone(state.refunds.filter((row) => row.order_id === Number(orderId)));
    },
    async sumSuccessfulRefunds(orderId) {
      return state.refunds
        .filter((row) => row.order_id === Number(orderId) && row.status === 'SUCCESS')
        .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    },
    async insertAudit(row) {
      state.audit.push({ id: nextId(), ...row });
    },
  };
}
