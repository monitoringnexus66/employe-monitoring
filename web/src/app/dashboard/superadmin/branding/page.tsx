"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Save, Loader2, UploadCloud, X } from "lucide-react";

export default function SuperAdminBrandingPage() {
  const [appName, setAppName] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/superadmin/branding")
      .then(res => res.json())
      .then(data => {
        setAppName(data.appName || "CHIIO OS");
        setLogoBase64(data.logoBase64 || null);
        setLoading(false);
      });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Max size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, logoBase64 }),
      });
      if (res.ok) {
        alert("Branding saved successfully! Refresh the page to see global changes.");
      } else {
        alert("Failed to save branding");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <ImageIcon className="w-8 h-8 text-blue-500" /> Platform Branding
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize the overarching application name and default logo for all tenants.
        </p>
      </div>

      <div className="glass-card p-6 rounded-xl border border-white/5 max-w-2xl">
        <div className="space-y-6">
          
          {/* App Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. CHIIO OS"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This name will be used in the sidebar and page titles.
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Platform Logo</label>
            
            {logoBase64 ? (
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center p-4">
                  <img src={logoBase64} alt="Platform Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <button
                  onClick={() => setLogoBase64(null)}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">SVG, PNG, or JPG (Max 2MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Branding
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
