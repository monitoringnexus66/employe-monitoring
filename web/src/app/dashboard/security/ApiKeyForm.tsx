"use client";

import { useState, useEffect } from "react";
import { Key, Loader2, Save } from "lucide-react";

export default function ApiKeyForm() {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchSessionAndSettings = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
            setIsAdmin(true);
            const res = await fetch("/api/tenant/settings");
            if (res.ok) {
              const data = await res.json();
              setApiKey(data.tenant.deepseekApiKey || "");
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionAndSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: "", type: "" });
    setSaving(true);

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deepseekApiKey: apiKey }),
      });

      if (res.ok) {
        setStatus({ message: "API Key saved successfully!", type: "success" });
      } else {
        const data = await res.json();
        setStatus({ message: data.error || "Failed to save API Key", type: "error" });
      }
    } catch (error) {
      setStatus({ message: "An unexpected error occurred", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <Key className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">DeepSeek API Key</h2>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Configure your DeepSeek API key to enable AI-powered productivity insights and automatic application categorization.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full pl-10 bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save API Key"}
          </button>

          {status.message && (
            <span className={`text-sm font-medium ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {status.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
