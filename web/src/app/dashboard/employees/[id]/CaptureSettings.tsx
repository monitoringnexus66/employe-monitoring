"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CaptureSettings({ membershipId, initialInterval }: { membershipId: string, initialInterval: number }) {
  const [interval, setInterval] = useState(initialInterval);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  // Sync state when initialInterval changes from server (e.g. after router.refresh)
  useEffect(() => {
    setInterval(initialInterval);
  }, [initialInterval]);

  const handleSave = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    try {
      await fetch(`/api/employees/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, screenshotInterval: interval })
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 relative">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-400" /> Capture Settings
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Screenshot Frequency</label>
          <select 
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full bg-[#1c1f26] border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 transition-colors"
          >
            <option value={60}>Every 1 Minute</option>
            <option value={300}>Every 5 Minutes</option>
            <option value={600}>Every 10 Minutes</option>
            <option value={1800}>Every 30 Minutes</option>
            <option value={0}>Disabled</option>
          </select>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving || interval === initialInterval}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 relative overflow-hidden"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : showSuccess ? (
            <><CheckCircle2 className="w-4 h-4 text-green-300" /> <span className="text-green-50">Saved Successfully!</span></>
          ) : (
            "Save Configuration"
          )}
        </button>
      </div>
    </div>
  );
}
