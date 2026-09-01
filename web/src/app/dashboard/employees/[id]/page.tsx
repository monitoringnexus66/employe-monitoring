import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Monitor, Clock, Image as ImageIcon, PieChart } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import ScreenshotGallery from "./ScreenshotGallery";
import CaptureSettings from "./CaptureSettings";
import DatePickerFilter from "./DatePickerFilter";
import DeleteEmployeeButton from "./DeleteEmployeeButton";
import JobDescriptionEditor from "./JobDescriptionEditor";
import ActivityTimeline from "./ActivityTimeline";

export const dynamic = 'force-dynamic';

export default async function EmployeeProfilePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ date?: string }> }) {
  const { id } = await params;
  const { date } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "EMPLOYEE") redirect("/dashboard/security");

  const user = await prisma.user.findFirst({
    where: { 
      id,
      memberships: { some: { tenantId: session.tenantId, role: "EMPLOYEE" } }
    },
    include: { 
      devices: { orderBy: { lastPing: 'desc' } },
      memberships: { where: { tenantId: session.tenantId } }
    }
  });

  if (!user) {
    notFound();
  }

  // Determine Date Range
  let startOfDay: Date;
  let endOfDay: Date;

  if (date && date.includes('-')) {
    const [year, month, day] = date.split('-').map(Number);
    startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  } else {
    const now = new Date();
    startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  // Get device IDs to fetch logs
  const deviceIds = user.devices.map(d => d.id);

  // Fetch up to 1000 recent logs scoped to this workspace and date
  const logs = await prisma.activityLog.findMany({
    where: { 
      deviceId: { in: deviceIds }, 
      tenantId: session.tenantId,
      timestamp: { gte: startOfDay, lte: endOfDay }
    },
    orderBy: { timestamp: 'desc' },
    take: 1000
  });

  const screenshots = await prisma.screenshot.findMany({
    where: { 
      deviceId: { in: deviceIds }, 
      tenantId: session.tenantId,
      timestamp: { gte: startOfDay, lte: endOfDay }
    },
    orderBy: { timestamp: 'desc' },
    take: 20
  });

  // Calculate App Usage Time
  const appUsage: Record<string, number> = {};
  let totalTrackedSeconds = 0;

  logs.forEach(log => {
    let appName = log.appName;
    
    // Intelligent heuristic for browsers to extract website name
    if (["Google Chrome", "Safari", "Arc", "Firefox", "Microsoft Edge", "Brave Browser"].includes(appName)) {
      // Window titles from browsers usually follow: "Website Title - Browser Name"
      let cleanTitle = log.windowTitle;
      const separators = [" - ", " — ", " | "];
      
      for (const sep of separators) {
        if (cleanTitle.includes(sep)) {
          cleanTitle = cleanTitle.split(sep)[0].trim();
          break;
        }
      }
      // Set the "App Name" to the website name for granular tracking
      appName = cleanTitle || appName;
    }

    if (!appUsage[appName]) appUsage[appName] = 0;
    appUsage[appName] += log.durationSeconds;
    totalTrackedSeconds += log.durationSeconds;
  });

  // Sort apps by highest time spent
  const topApps = Object.entries(appUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Helper to format seconds into readable text
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins} min`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/employees" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {user.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{user.name}</h1>
              <p className="text-muted-foreground mt-1">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <DatePickerFilter />
          <DeleteEmployeeButton userId={user.id} userName={user.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Time Spent / App Usage Card */}
          <div className="glass-card rounded-xl p-6">
             <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
               <PieChart className="w-5 h-5 text-yellow-400" /> Time Spent
             </h2>
             <div className="space-y-5">
               {topApps.map(([app, seconds]) => {
                 const percentage = Math.max(1, Math.min(100, Math.round((seconds / totalTrackedSeconds) * 100)));
                 return (
                   <div key={app}>
                     <div className="flex justify-between items-end mb-1.5">
                       <span className="text-sm font-medium text-white truncate max-w-[180px]" title={app}>{app}</span>
                       <span className="text-xs text-muted-foreground font-medium">{formatTime(seconds)}</span>
                     </div>
                     <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 rounded-full" 
                         style={{ width: `${percentage}%` }}
                       />
                     </div>
                   </div>
                 );
               })}
               {topApps.length === 0 && (
                 <p className="text-sm text-muted-foreground">No app usage data available.</p>
               )}
             </div>
          </div>

          {/* Connected Devices */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" /> Connected Devices
            </h2>
            <div className="space-y-3">
              {user.devices.map(device => (
                <div key={device.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm font-medium text-white">ID: {device.id}</p>
                  <p className="text-xs text-gray-400 mt-1">OS: {device.osInfo}</p>
                  <p className="text-xs text-gray-500 mt-1">Last Sync: {new Date(device.lastPing).toLocaleString()}</p>
                </div>
              ))}
              {user.devices.length === 0 && (
                <p className="text-sm text-gray-500 italic">No devices connected.</p>
              )}
            </div>
          </div>

          <JobDescriptionEditor userId={user.id} initialJobDescription={user.memberships[0].jobDescription} />

          <CaptureSettings membershipId={user.memberships[0].id} initialInterval={user.memberships[0].screenshotInterval} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Screenshots Gallery */}
          <ScreenshotGallery screenshots={screenshots} />

          {/* Activity Timeline */}
          <ActivityTimeline logs={logs} />
        </div>

      </div>
    </div>
  );
}
