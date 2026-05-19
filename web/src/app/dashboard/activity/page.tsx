import prisma from "@/lib/prisma";
import { Activity } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const logs = await prisma.activityLog.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { timestamp: 'desc' },
    take: 50,
    include: {
      device: { include: { user: true } }
    }
  });

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
                <th className="p-4 font-medium text-muted-foreground text-sm">Timestamp</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Employee</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Application</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Window Title</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm text-gray-300">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4 text-sm font-medium text-white">{log.device?.user?.name || "Unknown"}</td>
                  <td className="p-4 text-sm text-blue-400">{log.appName}</td>
                  <td className="p-4 text-sm text-gray-400 max-w-xs truncate">{log.windowTitle}</td>
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
    </div>
  );
}
