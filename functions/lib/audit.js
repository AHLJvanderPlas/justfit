// functions/lib/audit.js
// Audit log helper. Call writeAudit on every privileged mutation.

export const ACTIONS = Object.freeze({
  // Auth / identity
  LOGIN:                    'login',
  LOGOUT:                   'logout',
  // Gym
  GYM_CREATED:              'gym.created',
  GYM_UPDATED:              'gym.updated',
  // Membership
  MEMBER_INVITED:           'member.invited',
  MEMBER_JOINED:            'member.joined',
  MEMBER_SUSPENDED:         'member.suspended',
  MEMBER_REMOVED:           'member.removed',
  // Disclosure
  DISCLOSURE_CREATED:       'disclosure.created',
  DISCLOSURE_UPDATED:       'disclosure.updated',
  DISCLOSURE_UPGRADE_REQUESTED: 'disclosure.upgrade_requested',
  DISCLOSURE_UPGRADE_ACCEPTED:  'disclosure.upgrade_accepted',
  DISCLOSURE_UPGRADE_DECLINED:  'disclosure.upgrade_declined',
  // Intake
  INTAKE_SUBMITTED:         'intake.submitted',
  INTAKE_UPDATED:           'intake.updated',
  // Exercises
  EXERCISE_CREATED:         'exercise.created',
  EXERCISE_UPDATED:         'exercise.updated',
  EXERCISE_DELETED:         'exercise.deleted',
  // Programs
  PROGRAM_CREATED:          'program.created',
  PROGRAM_UPDATED:          'program.updated',
  PROGRAM_DELETED:          'program.deleted',
  PROGRAM_ASSIGNED:         'program.assigned',
  PROGRAM_ASSIGNMENT_CANCELLED: 'program.assignment.cancelled',
  // Session
  SESSION_COMPLETED:        'session.completed',
  WARNING_OVERRIDDEN:       'warning.overridden',
  // Invoices
  INVOICE_CREATED:          'invoice.created',
  INVOICE_SENT:             'invoice.sent',
  INVOICE_PAID:             'invoice.paid',
  INVOICE_VOIDED:           'invoice.voided',
  // BTW / supplier
  SUPPLIER_INVOICE_CREATED: 'supplier_invoice.created',
  SUPPLIER_INVOICE_DELETED: 'supplier_invoice.deleted',
  // GDPR
  GDPR_EXPORT_REQUESTED:    'gdpr.export_requested',
  GDPR_DELETE_REQUESTED:    'gdpr.delete_requested',
  GDPR_DELETE_CANCELLED:    'gdpr.delete_cancelled',
  GDPR_DELETE_EXECUTED:     'gdpr.delete_executed',
  // DPA
  DPA_ACKNOWLEDGED:         'dpa.acknowledged',
});

/**
 * Write an audit log entry.
 * Non-blocking: errors are logged but not re-thrown (audit must not break the main flow).
 */
export async function writeAudit({ gymId, actorUserId, action, targetType, targetId, payload, request, env }) {
  try {
    const ip = request?.headers?.get('CF-Connecting-IP') ?? request?.headers?.get('X-Forwarded-For') ?? null;
    const ua = request?.headers?.get('User-Agent') ?? null;
    await env.DB.prepare(
      `INSERT INTO audit_log (id, gym_id, actor_user_id, action, target_type, target_id, payload_json, ip, user_agent, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      gymId ?? null,
      actorUserId ?? null,
      action,
      targetType ?? null,
      targetId ?? null,
      payload ? JSON.stringify(payload) : null,
      ip,
      ua,
      Date.now()
    ).run();
  } catch (e) {
    console.error('[audit] write failed:', e?.message, { action, targetId });
  }
}
