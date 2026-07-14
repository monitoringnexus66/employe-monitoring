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

      <div className="glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center border-b border-white/10 bg-white/5 p-4 text-sm font-medium text-muted-foreground">
            <div className="w-1/4">Timestamp</div>
            <div className="w-24">Status</div>
            <div className="w-1/4">Employee</div>
            <div className="flex-1">Application / Window</div>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center p-4 hover:bg-white/5 transition-colors">
                <div className="w-1/4 text-sm text-gray-300 truncate pr-4">{new Date(log.timestamp).toLocaleString()}</div>
                <div className="w-24 shrink-0">
                  {log.isIdle ? (
                    <span className="px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">Idle</span>
                  ) : (
                    <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">Active</span>
                  )}
                </div>
                <div className="w-1/4 text-sm font-medium text-white truncate pr-4">{log.device?.user?.name || "Unknown"}</div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-blue-400 font-medium text-sm truncate">{log.appName}</span>
                  <span className="text-gray-500 text-xs mt-0.5 truncate">{log.windowTitle}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No activity logs recorded yet.
              </div>
            )}
          </div>
      </div>
      
      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}
