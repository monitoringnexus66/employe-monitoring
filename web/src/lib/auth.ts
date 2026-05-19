import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const SECRET = "nexus-super-secret-key-for-mvp";

export function signToken(payload: object) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('base64');
  return `${data}.${signature}`;
}

export function verifyToken(token: string) {
  try {
    const [data, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(data).digest('base64');
    if (signature === expectedSignature) {
      return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    }
  } catch (e) {
    return null;
  }
  return null;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nexus_auth')?.value;
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { memberships: { include: { tenant: true } } }
  });
  
  if (!user) return null;

  // Resolve active workspace role and scoping
  const activeTenantId = payload.activeTenantId || user.memberships[0]?.tenantId;
  const activeMembership = user.memberships.find(m => m.tenantId === activeTenantId);

  return {
    ...user,
    role: user.isSuperAdmin ? "SUPERADMIN" : (activeMembership?.role || "EMPLOYEE"),
    tenantId: activeTenantId,
    activeMembership
  };
}
