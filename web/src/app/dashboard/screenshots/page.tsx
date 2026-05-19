import prisma from "@/lib/prisma";
import { Image as ImageIcon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ScreenshotsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const screenshots = await prisma.screenshot.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { timestamp: 'desc' },
    take: 24,
    include: {
      device: { include: { user: true } }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Screenshot Gallery</h1>
        <p className="text-muted-foreground mt-1">Recent visual captures from employee workstations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {screenshots.map((shot) => (
          <div key={shot.id} className="glass-card rounded-xl overflow-hidden group">
            <div className="relative aspect-video bg-black/50 border-b border-white/10">
              <img 
                src={shot.s3Url} 
                alt="Capture" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                 <button className="self-end px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded text-xs font-medium text-white transition-colors">
                   View Full Size
                 </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{shot.device?.user?.name || "Unknown User"}</p>
                <p className="text-xs text-muted-foreground">{new Date(shot.timestamp).toLocaleString()}</p>
              </div>
              <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                Activity: {shot.activityLevel}%
              </div>
            </div>
          </div>
        ))}
        
        {screenshots.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No screenshots captured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
