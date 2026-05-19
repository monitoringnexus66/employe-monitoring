import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, ShieldCheck } from "lucide-react";
import CreateTenantModal from "./CreateTenantModal";
import TenantCard from "./TenantCard";

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: { memberships: true, activityLogs: true }
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-500" /> Super Admin Portal
          </h1>
          <p className="text-muted-foreground mt-1">Manage global system settings and create isolated client companies.</p>
        </div>
        <CreateTenantModal />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map(tenant => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </div>
    </div>
  );
}
