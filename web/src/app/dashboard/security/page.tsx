"use client";

import { useState } from "react";
import { ShieldCheck, KeyRound, Loader2, Lock } from "lucide-react";

export default function SecurityPage() {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status.message) setStatus({ message: "", type: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: "", type: "" });

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setStatus({ message: "All fields are required", type: "error" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ message: "New passwords do not match", type: "error" });
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatus({ message: "New password must be at least 6 characters", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ message: "Password updated successfully!", type: "success" });
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setStatus({ message: data.error || "Failed to update password", type: "error" });
      }
    } catch (error) {
      setStatus({ message: "An unexpected error occurred", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-green-400" /> Security
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account security and authentication.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <KeyRound className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Change Password</h2>
          </div>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 6 characters long.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 bg-secondary/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Updating..." : "Update Password"}
              </button>

              {status.message && (
                <span className={`text-sm font-medium ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {status.message}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Download Agent */}
        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6 bg-gradient-to-b from-blue-900/20 to-transparent">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <h2 className="text-xl font-semibold text-white">Desktop Agent</h2>
          </div>
          
          <p className="text-sm text-muted-foreground">
            You must install the tracking agent to begin monitoring activity.
          </p>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                </div>
                <span className="text-sm font-medium text-white">Download for Mac</span>
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                </div>
                <span className="text-sm font-medium text-white">Download for Windows</span>
              </div>
            </button>
          </div>

          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <p className="text-xs text-blue-200">
              Log in to the desktop app using your current employee email and password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
