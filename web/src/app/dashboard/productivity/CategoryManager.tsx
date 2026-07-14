"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type AppData = {
  appName: string;
  durationSeconds: number;
  category: "PRODUCTIVE" | "UNPRODUCTIVE" | "NEUTRAL";
};

export default function CategoryManager({ initialApps }: { initialApps: AppData[] }) {
  const [apps, setApps] = useState<AppData[]>(initialApps);
  const [search, setSearch] = useState("");
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  const filteredApps = apps.filter(app => app.appName.toLowerCase().includes(search.toLowerCase()));

  const handleCategoryChange = async (appName: string, newCategory: string) => {
    setLoadingApp(appName);
    try {
      const res = await fetch("/api/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, category: newCategory }),
      });

      if (res.ok) {
        setApps(prev => prev.map(a => a.appName === appName ? { ...a, category: newCategory as any } : a));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingApp(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-white/5">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h2 className="text-lg font-semibold text-white">Application Categories</h2>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 font-medium text-muted-foreground text-sm">Application Name</th>
              <th className="p-4 font-medium text-muted-foreground text-sm">Total Time Tracked (30d)</th>
              <th className="p-4 font-medium text-muted-foreground text-sm">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredApps.map((app) => (
              <tr key={app.appName} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-sm font-medium text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 font-bold text-blue-400">
                    {app.appName.charAt(0).toUpperCase()}
                  </div>
                  {app.appName}
                </td>
                <td className="p-4 text-sm text-gray-400">{formatDuration(app.durationSeconds)}</td>
                <td className="p-4">
                  <div className="relative">
                    <select
                      value={app.category}
                      onChange={(e) => handleCategoryChange(app.appName, e.target.value)}
                      disabled={loadingApp === app.appName}
                      className={`appearance-none px-4 py-1.5 pr-8 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-colors
                        ${app.category === 'PRODUCTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                          app.category === 'UNPRODUCTIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}
                    >
                      <option value="PRODUCTIVE" className="bg-black text-white">Productive</option>
                      <option value="NEUTRAL" className="bg-black text-white">Neutral</option>
                      <option value="UNPRODUCTIVE" className="bg-black text-white">Unproductive</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {filteredApps.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">No applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
