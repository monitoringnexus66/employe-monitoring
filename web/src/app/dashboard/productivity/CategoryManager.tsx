"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

type AppData = {
  appName: string;
  durationSeconds: number;
  category: "PRODUCTIVE" | "UNPRODUCTIVE" | "NEUTRAL";
};

export default function CategoryManager({ 
  initialApps, 
  employees 
}: { 
  initialApps: AppData[], 
  employees: {id: string, name: string}[] 
}) {
  const [apps, setApps] = useState<AppData[]>(initialApps);
  const [search, setSearch] = useState("");
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("global");
  const [fetchingOverrides, setFetchingOverrides] = useState(false);

  useEffect(() => {
    if (selectedUserId === "global") {
      setApps(initialApps);
      return;
    }

    const fetchOverrides = async () => {
      setFetchingOverrides(true);
      try {
        const res = await fetch(`/api/productivity/employee-overrides?userId=${selectedUserId}`);
        if (res.ok) {
          const overrides = await res.json();
          // Merge overrides with initial global apps
          const mergedApps = initialApps.map(app => {
            const override = overrides.find((o: any) => o.appName === app.appName);
            return {
              ...app,
              category: override ? override.category : app.category
            };
          });
          setApps(mergedApps);
        }
      } catch (error) {
        console.error("Error fetching overrides", error);
      } finally {
        setFetchingOverrides(false);
      }
    };

    fetchOverrides();
  }, [selectedUserId, initialApps]);

  const filteredApps = apps.filter(app => app.appName.toLowerCase().includes(search.toLowerCase()));

  const handleCategoryChange = async (appName: string, newCategory: string) => {
    setLoadingApp(appName);
    try {
      const endpoint = selectedUserId === "global" 
        ? "/api/productivity" 
        : "/api/productivity/employee-overrides";
        
      const payload = selectedUserId === "global"
        ? { appName, category: newCategory }
        : { userId: selectedUserId, appName, category: newCategory };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-white/5 gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          Application Categories
          {fetchingOverrides && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="global">🌍 Global Defaults</option>
            <optgroup label="Employee Overrides">
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>👤 {emp.name}</option>
              ))}
            </optgroup>
          </select>
          
          <div className="relative w-full sm:w-64">
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
