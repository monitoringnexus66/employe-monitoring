"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Trash2, 
  Clock, 
  HardDrive, 
  ShieldCheck, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  Sparkles,
  Database,
  Calendar
} from "lucide-react";

interface StorageStats {
  totalScreenshots: number;
  expiredScreenshots: number;
  oldestScreenshotDate: string | null;
  newestScreenshotDate: string | null;
  autoDeleteScreenshots: boolean;
  screenshotRetentionDays: number;
  lastCleanupAt: string | null;
  lastDeletedCount: number;
}

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Settings state
  const [autoDelete, setAutoDelete] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("30");
  const [deepseekApiKey, setDeepseekApiKey] = useState("");

  // Storage metrics
  const [stats, setStats] = useState<StorageStats | null>(null);

  const presets = [
    { label: "1 Day (24 Hours)", value: 1 },
    { label: "3 Days", value: 3 },
    { label: "7 Days (1 Week)", value: 7 },
    { label: "14 Days (2 Weeks)", value: 14 },
    { label: "30 Days (1 Month)", value: 30 },
    { label: "60 Days (2 Months)", value: 60 },
    { label: "90 Days (Quarterly)", value: 90 },
    { label: "180 Days (6 Months)", value: 180 },
    { label: "365 Days (1 Year)", value: 365 },
  ];

  const fetchSettingsAndStats = async () => {
    try {
      const res = await fetch("/api/superadmin/settings");
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || {};
        const statsData = data.stats || null;

        setAutoDelete(settings.autoDeleteScreenshots ?? true);
        const days = settings.screenshotRetentionDays ?? 30;
        setRetentionDays(days);
        setDeepseekApiKey(settings.deepseekApiKey || "");
        setStats(statsData);

        const isPreset = presets.some(p => p.value === days);
        if (!isPreset) {
          setIsCustomDays(true);
          setCustomDaysInput(days.toString());
        } else {
          setIsCustomDays(false);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setStatusMessage({ text: "Failed to load system settings", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndStats();
  }, []);

  const handlePresetSelect = (value: number) => {
    setIsCustomDays(false);
    setRetentionDays(value);
    setCustomDaysInput(value.toString());
  };

  const handleSaveRetention = async () => {
    setSaving(true);
    setStatusMessage(null);

    const effectiveDays = isCustomDays ? Math.max(1, parseInt(customDaysInput || "30", 10)) : retentionDays;

    try {
      const res = await fetch("/api/superadmin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoDeleteScreenshots: autoDelete,
          screenshotRetentionDays: effectiveDays,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRetentionDays(effectiveDays);
        setStatusMessage({ text: "Screenshot retention timer saved successfully!", type: "success" });
      } else {
        setStatusMessage({ text: "Failed to save retention settings", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: "An error occurred while saving", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKey = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/superadmin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deepseekApiKey }),
      });

      if (res.ok) {
        setStatusMessage({ text: "AI API Key saved successfully!", type: "success" });
      } else {
        setStatusMessage({ text: "Failed to save API Key", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: "An error occurred while saving API key", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRunCleanupNow = async () => {
    if (!confirm("Are you sure you want to run screenshot cleanup now? This will permanently delete screenshots older than your retention policy.")) {
      return;
    }

    setPurging(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/superadmin/settings/cleanup", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setStatusMessage({
          text: `Cleanup successful: Deleted ${data.result.deletedCount} expired screenshot(s) from database & storage!`,
          type: "success",
        });
      } else {
        setStatusMessage({ text: "Failed to execute screenshot cleanup", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: "Error executing cleanup process", type: "error" });
    } finally {
      setPurging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-8 h-8 text-blue-500" /> System Settings & Storage
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure automated screenshot deletion timers, storage retention policies, and platform services.
          </p>
        </div>

        {statusMessage && (
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-medium animate-in fade-in ${
            statusMessage.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : statusMessage.type === "error"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
          }`}>
            {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {statusMessage.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: Retention Timer Configuration */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Card: Screenshot Auto-Deletion Timer */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Screenshot Auto-Deletion Timer</h2>
                  <p className="text-xs text-muted-foreground">Automated lifecycle and retention duration for workstation captures</p>
                </div>
              </div>

              {/* Status indicator badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                  autoDelete 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                }`}>
                  {autoDelete ? "Auto-Purge Active" : "Auto-Purge Paused"}
                </span>
              </div>
            </div>

            {/* Enable / Disable Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <h3 className="font-semibold text-white text-sm">Enable Automated Screenshot Deletion</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  When active, screenshots older than your specified timer will be automatically purged from both the database and Cloudflare R2 / S3 storage.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  checked={autoDelete} 
                  onChange={(e) => setAutoDelete(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Retention Timer Presets */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Retention Period / Timer
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {presets.map((preset) => {
                  const isSelected = !isCustomDays && retentionDays === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetSelect(preset.value)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10 font-bold"
                          : "bg-[#0B0F17] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsCustomDays(true)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left flex items-center justify-between ${
                    isCustomDays
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10 font-bold"
                      : "bg-[#0B0F17] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span>Custom Duration</span>
                  {isCustomDays && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              </div>

              {/* Custom Days Input */}
              {isCustomDays && (
                <div className="pt-2 animate-in fade-in">
                  <div className="flex items-center gap-3 bg-[#0B0F17] p-3 rounded-xl border border-blue-500/30">
                    <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                    <label className="text-xs text-slate-300 font-medium">Delete screenshots older than:</label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={customDaysInput}
                      onChange={(e) => setCustomDaysInput(e.target.value)}
                      className="w-24 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-400 font-medium">days</span>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation Note */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Screenshots older than <strong className="text-white">{isCustomDays ? customDaysInput : retentionDays} days</strong> will be permanently wiped automatically via scheduled background workers. You can also run immediate purging at any time using the <em>Run Auto-Deletion Now</em> button.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveRetention}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving Policy..." : "Save Retention Policy"}
              </button>
            </div>

          </div>

          {/* AI Intelligence Card */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DeepSeek AI Intelligence Key</h2>
                <p className="text-xs text-muted-foreground">Powers automated application productivity categorization and employee insights</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">DeepSeek API Key</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F17] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={saving}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving Key..." : "Save AI Key"}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Storage Health & Manual Purge */}
        <div className="space-y-8">
          
          {/* Storage Health Metrics Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Storage Health</h2>
              </div>
              <button
                type="button"
                onClick={fetchSettingsAndStats}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-4">
              
              <div className="p-4 rounded-xl bg-[#0B0F17] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Screenshots Stored</p>
                  <p className="text-2xl font-black text-white mt-0.5">
                    {stats?.totalScreenshots?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Database className="w-5 h-5" />
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                (stats?.expiredScreenshots || 0) > 0 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-[#0B0F17] border-white/5 text-slate-400"
              }`}>
                <div>
                  <p className="text-xs font-medium">Expired Screenshots</p>
                  <p className={`text-2xl font-black mt-0.5 ${
                    (stats?.expiredScreenshots || 0) > 0 ? "text-amber-400" : "text-white"
                  }`}>
                    {stats?.expiredScreenshots?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F17] border border-white/5 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Oldest Screenshot:</span>
                  <span className="text-white font-medium">
                    {stats?.oldestScreenshotDate 
                      ? new Date(stats.oldestScreenshotDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) 
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Newest Screenshot:</span>
                  <span className="text-white font-medium">
                    {stats?.newestScreenshotDate 
                      ? new Date(stats.newestScreenshotDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) 
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-white/5">
                  <span>Last Cleanup Run:</span>
                  <span className="text-emerald-400 font-medium">
                    {stats?.lastCleanupAt 
                      ? new Date(stats.lastCleanupAt).toLocaleString() 
                      : "Never"}
                  </span>
                </div>
              </div>

            </div>

            {/* Manual Purge Button */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleRunCleanupNow}
                disabled={purging}
                className="w-full py-2.5 px-4 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {purging ? "Purging Old Screenshots..." : "Run Auto-Deletion Now"}
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Forces immediate execution of the retention cleanup policy.
              </p>
            </div>

          </div>

          {/* Superadmin Quick Access */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Superadmin Tools</h3>
            <div className="space-y-2">
              <a 
                href="/dashboard/superadmin/customers" 
                className="block p-3 rounded-xl bg-[#0B0F17] hover:bg-white/5 border border-white/5 text-xs text-white font-medium transition-colors"
              >
                🏢 Customer & Tenant Management →
              </a>
              <a 
                href="/dashboard/superadmin/packages" 
                className="block p-3 rounded-xl bg-[#0B0F17] hover:bg-white/5 border border-white/5 text-xs text-white font-medium transition-colors"
              >
                📦 Pricing & Subscription Packages →
              </a>
              <a 
                href="/dashboard/superadmin/branding" 
                className="block p-3 rounded-xl bg-[#0B0F17] hover:bg-white/5 border border-white/5 text-xs text-white font-medium transition-colors"
              >
                🎨 Global Platform Branding & Logo →
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
