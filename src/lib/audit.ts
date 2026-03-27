import { prisma } from "@/lib/db";

interface AuditOptions {
  workspaceId: string;
  projectId?: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(options: AuditOptions) {
  return prisma.auditLog.create({
    data: {
      workspaceId: options.workspaceId,
      projectId: options.projectId,
      userId: options.userId,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      metadata: options.metadata as object ?? undefined,
      ipAddress: options.ipAddress,
    },
  });
}
