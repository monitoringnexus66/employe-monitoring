import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PackageOpen, Plus } from "lucide-react";
import CreatePackageModal from "./CreatePackageModal";
import EditPackageModal from "./EditPackageModal";

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const packages = await prisma.package.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <PackageOpen className="w-8 h-8 text-blue-500" /> Package Management
          </h1>
          <p className="text-muted-foreground mt-1">Define subscription packages and user limits for your customers.</p>
        </div>
        <CreatePackageModal />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-medium text-muted-foreground text-sm">Package Name</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Max Accounts</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Monthly Price</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Features</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Created Date</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {packages.map((pkg: any) => (
                <tr key={pkg.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm font-medium text-white">{pkg.name}</td>
                  <td className="p-4 text-sm text-blue-400 font-medium">{pkg.maxAccounts}</td>
                  <td className="p-4 text-sm text-green-400 font-medium">${pkg.monthlyPrice}</td>
                  <td className="p-4 text-sm">
                    {pkg.hasCCTV ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">Live CCTV</span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-medium">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-400">{new Date(pkg.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm">
                    <EditPackageModal pkg={pkg} />
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No packages created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
