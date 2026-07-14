"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Settings as SettingsIcon, Shield, Building2, CreditCard, Download, ExternalLink, Loader2, Info } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: "", type: "" });
  const [tenant, setTenant] = useState<any>(null);

  // Form State
    const [formData, setFormData] = useState({
    name: "",
    primaryContactName: "",
    primaryContactEmail: "",
    timezone: "UTC",
    defaultScreenshotInterval: 300,
    idleTimeout: 5,
    blurScreenshots: false,
    logoBase64: null as string | null,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/tenant/settings");
      if (res.ok) {
        const data = await res.json();
        setTenant(data.tenant);
        setFormData({
          name: data.tenant.name || "",
          primaryContactName: data.tenant.primaryContactName || "",
          primaryContactEmail: data.tenant.primaryContactEmail || "",
          timezone: data.tenant.timezone || "UTC",
          defaultScreenshotInterval: data.tenant.defaultScreenshotInterval || 300,
          idleTimeout: data.tenant.idleTimeout || 5,
          blurScreenshots: data.tenant.blurScreenshots || false,
          logoBase64: data.tenant.logoBase64 || null,
        });
      }
    } catch (error) {
      setSaveStatus({ message: "Failed to load settings", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveStatus({ message: "File is too large. Max size is 2MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, logoBase64: event.target?.result as string }));
      setSaveStatus({ message: "", type: "" });
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let finalValue: any = value;
    
    if (type === "checkbox") {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number" || name === "defaultScreenshotInterval") {
      finalValue = parseInt(value, 10);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (saveStatus.message) setSaveStatus({ message: "", type: "" });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus({ message: "", type: "" });
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSaveStatus({ message: "Settings saved successfully", type: "success" });
        const data = await res.json();
        setTenant(data.tenant);
        router.refresh();
      } else {
        setSaveStatus({ message: "Failed to save settings", type: "error" });
      }
    } catch (error) {
      setSaveStatus({ message: "An error occurred while saving", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-blue-400" /> Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your workspace configuration and tracking rules.</p>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus.message && (
            <span className={`text-sm font-medium ${saveStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {saveStatus.message}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tracking Rules */}
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Global Tracking Rules</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Screenshot Frequency</label>
                <select 
                  name="defaultScreenshotInterval"
                  value={formData.defaultScreenshotInterval}
                  onChange={handleChange}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value={60}>Every 1 Minute</option>
                  <option value={180}>Every 3 Minutes</option>
                  <option value={300}>Every 5 Minutes</option>
                  <option value={600}>Every 10 Minutes</option>
                  <option value={0}>Disabled</option>
                </select>
                <p className="text-xs text-muted-foreground">How often the desktop app captures screenshots.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Idle Timeout (Minutes)</label>
                <input 
                  type="number"
                  name="idleTimeout"
                  value={formData.idleTimeout}
                  onChange={handleChange}
                  min={1}
                  max={60}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <p className="text-xs text-muted-foreground">Minutes of inactivity before marking as Idle.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
              <div>
                <h3 className="font-medium text-white">Blur Screenshots (Privacy Mode)</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Automatically blur all captured screenshots for privacy.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="blurScreenshots" checked={formData.blurScreenshots} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>

          {/* Workspace Profile */}
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Workspace Profile</h2>
            </div>
            
            {/* Company Branding Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Company Logo (Optional)</label>
              <div className="flex items-center gap-6">
                {formData.logoBase64 ? (
                  <div className="relative">
                    <div className="w-24 h-24 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center p-2">
                      <img src={formData.logoBase64} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, logoBase64: null }));
                        if (saveStatus.message) setSaveStatus({ message: "", type: "" });
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer bg-black/30 hover:bg-black/50 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Upload</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}
                <div className="text-sm text-muted-foreground flex-1">
                  <p>Upload your company logo to display it on your employee's dashboard and exported reports.</p>
                  <p className="text-xs mt-1">Recommended size: 256x256px. Max size: 2MB.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Company Name</label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Timezone</label>
                <select 
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Primary Contact Name</label>
                <input 
                  type="text"
                  name="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={handleChange}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Primary Contact Email</label>
                <input 
                  type="email"
                  name="primaryContactEmail"
                  value={formData.primaryContactEmail}
                  onChange={handleChange}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Static Info Cards */}
        <div className="space-y-8">
          
          {/* Subscription Card */}
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <CreditCard className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Subscription</h2>
            </div>
            
            {tenant?.package ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-lg font-semibold text-white">{tenant.package.name}</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Employee Accounts</span>
                    <span className="text-white font-medium">{tenant._count?.memberships || 0} / {tenant.package.maxAccounts}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, ((tenant._count?.memberships || 0) / tenant.package.maxAccounts) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20 capitalize">
                    {tenant.subscriptionStatus}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No active subscription found.
              </div>
            )}
          </div>

          {/* Download Agent */}
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6 bg-gradient-to-b from-blue-900/20 to-transparent">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Download className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Desktop Agent</h2>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Employees must install the tracking agent to begin monitoring activity.
            </p>

            <div className="space-y-3">
              <a href="/downloads/NexusTrack-Mac.dmg" download className="block w-full">
                <div className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Download for Mac</span>
                  </div>
                </div>
              </a>
              
              <a href="/downloads/NexusTrack-Windows.exe" download className="block w-full">
                <div className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Download for Windows</span>
                  </div>
                </div>
              </a>
            </div>

            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 flex gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200">
                They will need to log in using their employee email and the password you generated for them.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
