export async function writeAudit(db, entry) {
  try {
    await db.insertAudit({
      actor_id: entry.actorId || null,
      actor_role: entry.actorRole || 'system',
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: String(entry.entityId || ''),
      order_id: entry.orderId || null,
      from_state: entry.fromState || null,
      to_state: entry.toState || null,
      metadata: entry.metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Audit write failed:', error.message);
  }
}
