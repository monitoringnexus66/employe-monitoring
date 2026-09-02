import { ExternalLink, Monitor, Download as DownloadIcon } from "lucide-react";

export default function DownloadPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Download Agent</h1>
        <p className="text-muted-foreground">
          Install the desktop agent to securely connect to your workspace and begin activity tracking.
        </p>
      </div>

      <div className="glass-card rounded-xl p-8 border border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Monitor className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Available Downloads</h2>
            <p className="text-sm text-gray-400">Choose the version for your operating system.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <a href="https://github.com/monitoringnexus66/employe-monitoring/releases/download/app-v0.2.2/chiiOs.Agent_0.2.2_universal.dmg" target="_blank" rel="noopener noreferrer" className="block">
            <div className="h-full flex flex-col items-center justify-center p-6 rounded-xl bg-secondary/50 hover:bg-secondary border border-white/10 transition-colors cursor-pointer group text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DownloadIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <span className="block font-semibold text-white mb-1">Mac OS</span>
                <span className="text-xs text-muted-foreground">Universal (Intel & M-Series)</span>
              </div>
            </div>
          </a>
          
          <a href="https://github.com/monitoringnexus66/employe-monitoring/releases/download/app-v0.2.2/chiiOs.Agent_0.2.2_x64-setup.exe" target="_blank" rel="noopener noreferrer" className="block">
            <div className="h-full flex flex-col items-center justify-center p-6 rounded-xl bg-secondary/50 hover:bg-secondary border border-white/10 transition-colors cursor-pointer group text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DownloadIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <span className="block font-semibold text-white mb-1">Windows</span>
                <span className="text-xs text-muted-foreground">Windows 10 & 11 (64-bit)</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
