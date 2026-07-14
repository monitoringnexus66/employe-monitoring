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
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-green-400" /> Security
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account security and authentication.</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-xl border border-white/5 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <KeyRound className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Change Password</h2>
        </div>
        
        <form onSubmit={handleSave} className="space-y-6 max-w-md">
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
    </div>
  );
}
