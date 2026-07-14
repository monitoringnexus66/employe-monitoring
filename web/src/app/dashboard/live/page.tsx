import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LiveClient from "./LiveClient";
import { Video } from "lucide-react";

export default async function LiveCCTVPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "SUPERADMIN") {
    redirect("/dashboard/superadmin");
  }
  if (session.role === "EMPLOYEE") {
    redirect("/dashboard/security");
  }
  if (!session.hasCCTV) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-500" /> Live CCTV Monitor
          </h1>
          <p className="text-muted-foreground mt-1">Watch real-time screens from all connected employees.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm font-medium text-red-400 uppercase tracking-widest">Live Streaming</span>
        </div>
      </div>

      <LiveClient tenantId={session.tenantId} />
    </div>
  );
}
