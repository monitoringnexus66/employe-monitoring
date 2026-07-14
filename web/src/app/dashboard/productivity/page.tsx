import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Target, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import CategoryManager from "./CategoryManager";

export const dynamic = 'force-dynamic';

export default async function ProductivityPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch unique apps used by employees in this tenant in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await prisma.activityLog.groupBy({
    by: ['appName'],
    where: { 
      tenantId: session.tenantId,
      timestamp: { gte: thirtyDaysAgo }
    },
    _sum: { durationSeconds: true },
    orderBy: {
      _sum: { durationSeconds: 'desc' }
    }
  });

  const categories = await prisma.appCategory.findMany({
    where: { tenantId: session.tenantId },
  });

  // Merge the data
  const apps = logs.map(log => {
    const existingCategory = categories.find(c => c.appName === log.appName);
    return {
      appName: log.appName,
      durationSeconds: log._sum.durationSeconds || 0,
      category: existingCategory?.category || "NEUTRAL"
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="w-8 h-8 text-blue-500" /> Productivity Scoring
          </h1>
          <p className="text-muted-foreground mt-1">Categorize applications to generate accurate productivity scores.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Productive</p>
              <p className="text-xs text-gray-400 mt-1">Tools required for work (e.g. VS Code, Slack)</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unproductive</p>
              <p className="text-xs text-gray-400 mt-1">Distractions (e.g. YouTube, Netflix)</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-500/10 text-gray-400 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Neutral</p>
              <p className="text-xs text-gray-400 mt-1">Background apps or unknown</p>
            </div>
          </div>
        </div>
      </div>

      <CategoryManager initialApps={apps} />
    </div>
  );
}
