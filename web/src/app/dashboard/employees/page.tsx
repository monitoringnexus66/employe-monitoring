import prisma from "@/lib/prisma";
import { Users, Monitor, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import AddEmployeeModal from "./AddEmployeeModal";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "EMPLOYEE") redirect("/dashboard/security");

  const users = await prisma.user.findMany({
    where: { memberships: { some: { tenantId: session.tenantId } } },
    include: {
      devices: true,
      memberships: { where: { tenantId: session.tenantId } }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and connected devices.</p>
        </div>
        <AddEmployeeModal />
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Link href={`/dashboard/employees/${user.id}`} key={user.id} className="block group">
            <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 bg-secondary/20 hover:bg-secondary/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                  {user.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                    {user.name}
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-4">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    {user.devices.length} Connected {user.devices.length === 1 ? 'Device' : 'Devices'}
                  </p>
                </div>
                <div className="hidden md:flex p-2 rounded-full bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                   <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
