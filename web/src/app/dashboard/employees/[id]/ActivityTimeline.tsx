"use client";

import { useState, useMemo } from "react";
import { Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface ActivityLogItem {
  id: string;
  appName: string;
  windowTitle: string;
  durationSeconds: number;
  isIdle: boolean;
  timestamp: string | Date;
}

export default function ActivityTimeline({ logs }: { logs: ActivityLogItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 15;

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const q = searchTerm.toLowerCase();
    return logs.filter(
      log => 
        log.appName.toLowerCase().includes(q) || 
        log.windowTitle.toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" /> Recent Activity Timeline
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Showing {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} total events
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search app or window..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-60"
          />
        </div>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {currentLogs.map(log => (
          <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-secondary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
              <div className={`w-3 h-3 rounded-full ${log.isIdle ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-blue-400 truncate max-w-[70%]">{log.appName}</span>
                <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-gray-300 leading-snug break-words">{log.windowTitle || "No window title"}</p>
            </div>
          </div>
        ))}
        
        {filteredLogs.length === 0 && (
          <p className="text-center text-muted-foreground py-8 relative z-10">
            {searchTerm ? "No activity matching your search." : "No recent activity."}
          </p>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-gray-400">
            Page <span className="font-semibold text-white">{currentPage}</span> of <span className="font-semibold text-white">{totalPages}</span>
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
