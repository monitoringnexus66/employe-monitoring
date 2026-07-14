import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import EditCustomerModal from "./EditCustomerModal";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      package: true,
      _count: {
        select: { memberships: true }
      }
    }
  });

  const packages = await prisma.package.findMany();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" /> Customer Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage tenant accounts, contact info, and subscription packages.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-medium text-muted-foreground text-sm">Company Name</th>
                <th className="p-4 font-medium text-muted-foreground text-sm w-24">Actions</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Customer ID</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Contact Name</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Email</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Phone</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Customer Since</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Subscription</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Users</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Status</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Monthly Val</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm font-medium text-white">{tenant.name}</td>
                  <td className="p-4 text-sm">
                    <EditCustomerModal tenant={tenant} packages={packages} />
                  </td>
                  <td className="p-4 text-sm text-gray-400">{tenant.customerId || "N/A"}</td>
                  <td className="p-4 text-sm text-gray-300">{tenant.primaryContactName || "N/A"}</td>
                  <td className="p-4 text-sm text-gray-300">{tenant.primaryContactEmail || "N/A"}</td>
                  <td className="p-4 text-sm text-gray-300">{tenant.primaryContactPhone || "N/A"}</td>
                  <td className="p-4 text-sm text-gray-400">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-blue-400 font-medium">
                    {tenant.package ? tenant.package.name : "None assigned"}
                  </td>
                  <td className="p-4 text-sm text-gray-300">
                    {tenant._count.memberships} / {tenant.package ? tenant.package.maxAccounts : "∞"}
                  </td>
                  <td className="p-4 text-sm">
                    {tenant.subscriptionStatus === "active" ? (
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">{tenant.subscriptionStatus}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-green-400 font-medium">
                    ${tenant.package ? tenant.package.monthlyPrice : 0}
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {tenant.renewalDate ? new Date(tenant.renewalDate).toLocaleDateString() : "N/A"}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-muted-foreground">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
