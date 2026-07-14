"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, User, Download, BrainCircuit, FileText, FileSpreadsheet } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

export default function TimesheetViewer({ employees, tenantId, appCategories }: { employees: any[], tenantId: string, appCategories: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>(employees[0]?.id || "");
  const [date, setDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightStartDate, setInsightStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [insightEndDate, setInsightEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (!selectedUserId) return;
    
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const dateStr = date.toISOString().split('T')[0];
        const res = await fetch(`/api/timesheets?userId=${selectedUserId}&date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [selectedUserId, date]);

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  const generateInsight = async () => {
    if (!selectedUserId) return;
    setLoadingInsight(true);
    setInsight(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: selectedUserId, 
          startDate: insightStartDate, 
          endDate: insightEndDate 
        }),
      });
      const data = await res.json();
      if (res.ok && data.insight) {
        setInsight(data.insight);
      } else {
        setInsight("Failed to generate insight or no data available.");
      }
    } catch (error) {
      console.error(error);
      setInsight("An error occurred while communicating with the AI.");
    } finally {
      setLoadingInsight(false);
    }
  };

  // Timeline rendering logic (9 AM to 5 PM mapped to 0-100%)
  // For a generic 24 hour view, we map 00:00 to 23:59
  const renderTimeline = () => {
    if (loading) {
      return <div className="h-24 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
    }
    
    if (logs.length === 0) {
      return <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">No activity recorded for this day.</div>;
    }

    return (
      <div className="relative h-24 bg-black/50 rounded-xl border border-white/10 overflow-hidden mt-8">
        {/* Hour markers */}
        {[...Array(25)].map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${(i / 24) * 100}%` }}>
            <span className="absolute -top-6 -translate-x-1/2 text-[10px] text-gray-500">{i}:00</span>
          </div>
        ))}

        {/* Activity Blocks */}
        {logs.map((log, i) => {
          const logTime = new Date(log.timestamp);
          const startSeconds = logTime.getHours() * 3600 + logTime.getMinutes() * 60 + logTime.getSeconds();
          // We assume duration is log.durationSeconds, if they overlap it's fine, they render on top
          const duration = log.durationSeconds;
          
          const leftPercent = (startSeconds / 86400) * 100;
          const widthPercent = (duration / 86400) * 100;
          
          // Determine color
          let bgColor = "bg-gray-500"; // Neutral/Idle
          if (log.isIdle) {
            bgColor = "bg-yellow-500";
          } else {
            const cat = appCategories.find(c => c.appName === log.appName)?.category || "NEUTRAL";
            if (cat === "PRODUCTIVE") bgColor = "bg-green-500";
            if (cat === "UNPRODUCTIVE") bgColor = "bg-red-500";
            if (cat === "NEUTRAL") bgColor = "bg-gray-400";
          }

          return (
            <div 
              key={i} 
              className={`absolute top-0 bottom-0 opacity-80 hover:opacity-100 hover:z-10 transition-opacity cursor-pointer ${bgColor}`}
              style={{ left: `${leftPercent}%`, width: `${Math.max(widthPercent, 0.1)}%` }}
              title={`${log.appName} - ${log.windowTitle} (${log.durationSeconds}s)`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-card rounded-xl p-6 border border-white/5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        
        {/* Employee Selector */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <select 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="appearance-none bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            {employees.map(e => (
              <option key={e.id} value={e.id} className="bg-black text-white">{e.name}</option>
            ))}
          </select>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          
          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-white/10 text-sm font-medium text-white transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
              Export
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-black/90 border border-white/10 shadow-xl overflow-hidden z-20 backdrop-blur-xl">
                <button 
                  onClick={() => {
                    const employeeName = employees.find(e => e.id === selectedUserId)?.name || "Employee";
                    exportToCSV(logs, employeeName, date);
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  Export as CSV
                </button>
                <button 
                  onClick={() => {
                    const employeeName = employees.find(e => e.id === selectedUserId)?.name || "Employee";
                    exportToPDF(logs, employeeName, date);
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors border-t border-white/5"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-4 bg-white/5 p-1 rounded-lg border border-white/10">
            <button onClick={handlePrevDay} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
            <span className="text-sm font-medium text-white min-w-[120px] text-center">
              {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button onClick={handleNextDay} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Actions */}
      <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">From:</label>
          <input 
            type="date" 
            value={insightStartDate}
            onChange={(e) => setInsightStartDate(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">To:</label>
          <input 
            type="date" 
            value={insightEndDate}
            onChange={(e) => setInsightEndDate(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <button 
          onClick={generateInsight}
          disabled={loadingInsight || !insightStartDate || !insightEndDate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
        >
          {loadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          {loadingInsight ? "Analyzing..." : "Generate AI Insight"}
        </button>
      </div>

      <div className="mt-4 mb-8">
        {renderTimeline()}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-xs text-gray-400">Productive</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs text-gray-400">Unproductive</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400"></div><span className="text-xs text-gray-400">Neutral</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-xs text-gray-400">Idle</span></div>
      </div>

      {/* AI Insight Card */}
      {insight && (
        <div className="mt-8 p-6 rounded-xl border border-purple-500/30 bg-purple-500/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">DeepSeek AI Analysis</h3>
          </div>
          <div className="prose prose-invert prose-p:text-sm prose-p:text-gray-300 prose-li:text-gray-300 max-w-none relative z-10">
            <ReactMarkdown>{insight}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
