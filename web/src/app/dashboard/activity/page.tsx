import prisma from "@/lib/prisma";
import { Activity } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

import Pagination from "@/components/Pagination";

export const dynamic = 'force-dynamic';

export default async function ActivityPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const page = parseInt(searchParams.page || "1");
  const take = 50;
  const skip = (page - 1) * take;

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
      include: {
        device: { include: { user: true } }
      }
    }),
    prisma.activityLog.count({
      where: { tenantId: session.tenantId }
    })
  ]);

  const totalPages = Math.ceil(totalCount / take);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Detailed Activity Log</h1>
          <p className="text-muted-foreground mt-1">A comprehensive timeline of all tracked applications.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-medium text-muted-foreground text-sm whitespace-nowrap w-48">Timestamp</th>
                <th className="p-4 font-medium text-muted-foreground text-sm whitespace-nowrap w-48">Employee</th>
                <th className="p-4 font-medium text-muted-foreground text-sm whitespace-nowrap w-48">Application</th>
                <th className="p-4 font-medium text-muted-foreground text-sm w-full">Window Title</th>
                <th className="p-4 font-medium text-muted-foreground text-sm whitespace-nowrap w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm text-gray-300 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4 text-sm font-medium text-white whitespace-nowrap">{log.device?.user?.name || "Unknown"}</td>
                  <td className="p-4 text-sm text-blue-400 whitespace-nowrap">{log.appName}</td>
                  <td className="p-4 text-sm text-gray-400 max-w-md truncate">{log.windowTitle}</td>
                  <td className="p-4 text-sm">
                    {log.isIdle ? (
                      <span className="px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">Idle</span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No activity logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}
