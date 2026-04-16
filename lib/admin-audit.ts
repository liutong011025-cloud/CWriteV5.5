import { prisma } from './prisma'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'view_user'
  | 'view_user_detail'
  | 'update_user'
  | 'delete_user'
  | 'create_user'
  | 'export_data'
  | 'change_role'
  | 'change_setting'

export interface AuditDetails {
  before?: unknown
  after?: unknown
  ip?: string
  userAgent?: string
  extra?: Record<string, unknown>
}

export async function logAudit(
  adminId: string,
  action: AuditAction,
  targetType?: string,
  targetId?: string,
  details?: AuditDetails
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      details: details ?? null,
    },
  })
}
