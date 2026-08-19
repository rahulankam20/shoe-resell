export function skuKey(productId, size) {
  return `${productId}:${size}`;
}

export async function loadInventory(db, items) {
  const rows = [];
  for (const item of items) {
    const row = await db.getInventory(skuKey(item.productId, item.size));
    if (!row) {
      const err = new Error(`No inventory for product ${item.productId} size ${item.size}`);
      err.code = 'STOCK_MISSING';
      throw err;
    }
    rows.push({ item, row });
  }
  return rows;
}

export function availableQty(row) {
  return Number(row.quantity || 0) - Number(row.reserved || 0);
}

export async function reserveStock(db, items) {
  const reserved = [];
  try {
    for (const item of items) {
      const key = skuKey(item.productId, item.size);
      const row = await db.getInventory(key);
      if (!row) {
        const err = new Error(`Size ${item.size} is no longer available`);
        err.code = 'STOCK_MISSING';
        throw err;
      }
      if (availableQty(row) < item.quantity) {
        const err = new Error(`Only ${Math.max(0, availableQty(row))} left for size ${item.size}`);
        err.code = 'OUT_OF_STOCK';
        throw err;
      }
      const updated = await db.updateInventory(key, row.version, {
        reserved: Number(row.reserved) + item.quantity,
        version: Number(row.version) + 1,
        updated_at: new Date().toISOString(),
      });
      if (!updated) {
        const err = new Error('Another shopper just reserved the last pair. Refresh and try again.');
        err.code = 'STOCK_RACE';
        throw err;
      }
      reserved.push({ ...item, sku: key, previousReserved: row.reserved, version: row.version });
    }
    return reserved;
  } catch (error) {
    await releaseStock(db, reserved);
    throw error;
  }
}

export async function releaseStock(db, reservations) {
  for (const item of reservations || []) {
    const key = item.sku || skuKey(item.productId, item.size);
    const row = await db.getInventory(key);
    if (!row) continue;
    const nextReserved = Math.max(0, Number(row.reserved) - item.quantity);
    await db.updateInventory(key, row.version, {
      reserved: nextReserved,
      version: Number(row.version) + 1,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function captureStock(db, items) {
  const captured = [];
  try {
    for (const item of items) {
      const key = skuKey(item.productId, item.size);
      const row = await db.getInventory(key);
      if (!row) {
        const err = new Error('Inventory row missing during capture');
        err.code = 'STOCK_MISSING';
        throw err;
      }
      const qty = Number(row.quantity);
      const reserved = Number(row.reserved);
      if (qty < item.quantity) {
        const err = new Error('Insufficient stock during capture');
        err.code = 'OUT_OF_STOCK';
        throw err;
      }
      const updated = await db.updateInventory(key, row.version, {
        quantity: qty - item.quantity,
        reserved: Math.max(0, reserved - item.quantity),
        version: Number(row.version) + 1,
        updated_at: new Date().toISOString(),
      });
      if (!updated) {
        const err = new Error('Stock capture lost a race');
        err.code = 'STOCK_RACE';
        throw err;
      }
      captured.push({ ...item, sku: key, previousQuantity: qty, previousReserved: reserved });
    }
    return captured;
  } catch (error) {
    for (const item of captured) {
      const row = await db.getInventory(item.sku);
      if (!row) continue;
      await db.updateInventory(item.sku, row.version, {
        quantity: Number(row.quantity) + item.quantity,
        reserved: Number(row.reserved) + item.quantity,
        version: Number(row.version) + 1,
        updated_at: new Date().toISOString(),
      });
    }
    throw error;
  }
}

export async function syncProductStockDisplay(db, productIds) {
  if (!db.syncProductStock) return;
  for (const productId of [...new Set(productIds)]) {
    await db.syncProductStock(productId);
  }
}
