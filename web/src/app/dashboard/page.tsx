import { Users, Clock, Zap, TrendingUp, Activity, Monitor } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  
  if (session.role === "SUPERADMIN") {
    redirect("/dashboard/superadmin");
  }
  
  if (session.role === "EMPLOYEE") {
    redirect("/dashboard/security");
  }

  const tenantId = session.tenantId;

  const [totalEmployees, totalLogsCount, activityLogs, screenshots] = await Promise.all([
    prisma.user.count({ where: { memberships: { some: { tenantId } } } }),
    prisma.activityLog.count({ where: { tenantId } }),
    prisma.activityLog.findMany({
      where: { tenantId },
      take: 8,
      orderBy: { timestamp: 'desc' },
      include: { device: { include: { user: true } } }
    }),
    prisma.screenshot.findMany({
      where: { tenantId },
      take: 3,
      orderBy: { timestamp: 'desc' },
      include: { device: { include: { user: true } } }
    })
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your team's real-time productivity and activity.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden sm:block">
            <span className="text-green-400 font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Receiving Live Data
            </span>
          </div>
          <a href="/dashboard/live" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
            <Monitor className="w-4 h-4" />
            View Live CCTV
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={totalEmployees.toString()} icon={Users} color="blue" />
        <StatCard title="Avg. Productivity" value="84%" icon={Zap} trend="+5% from last week" color="green" />
        <StatCard title="Total Logs Received" value={activityLogs.length.toString()} icon={Clock} color="purple" />
        <StatCard title="Apps Tracked" value="Live" icon={TrendingUp} color="orange" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Live Activity Feed</h2>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {activityLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">Waiting for agent data...</p>
            ) : (
              activityLogs.map((activity, i) => {
                const name = activity.device?.user?.name || "Unknown User";
                const initials = name.split(" ").map(n => n[0]).join("");
                
                return (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {initials}
                      </div>
                      <div className="max-w-xs md:max-w-md lg:max-w-xs xl:max-w-md">
                        <p className="font-medium text-white">{name}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.appName} - {activity.windowTitle}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-muted-foreground">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                      <p className="text-xs font-medium mt-0.5 text-green-400">Active</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Screenshots */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Live Captures</h2>
          </div>
          <div className="space-y-4">
            {screenshots.length === 0 ? (
              <p className="text-muted-foreground text-sm">Waiting for screenshots (taken every 60s)...</p>
            ) : (
              screenshots.map((shot, i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg border border-white/10 aspect-video bg-secondary/50 cursor-pointer">
                  <img src={shot.s3Url} alt="Screen capture" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex flex-col justify-end p-4">
                    <p className="text-sm font-medium text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                      {shot.device?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-300 translate-y-2 group-hover:translate-y-0 transition-transform delay-75">
                      {new Date(shot.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  };

  const bgClass = colorMap[color] || colorMap.blue;

  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl -mr-16 -mt-16 transition-opacity duration-500 opacity-20 group-hover:opacity-50 ${
        color === 'blue' ? 'from-blue-500 to-transparent' :
        color === 'green' ? 'from-green-500 to-transparent' :
        color === 'purple' ? 'from-purple-500 to-transparent' :
        'from-orange-500 to-transparent'
      }`}></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-2 rounded-lg border ${bgClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 relative z-10">
        <h2 className="text-3xl font-bold text-white">{value}</h2>
        {trend && (
          <span className="text-xs font-medium text-green-400">{trend}</span>
        )}
      </div>
    </div>
  );
}
