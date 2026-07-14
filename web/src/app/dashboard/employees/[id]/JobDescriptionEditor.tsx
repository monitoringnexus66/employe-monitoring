"use client";

import { useState } from "react";
import { Briefcase, BrainCircuit, Loader2, CheckCircle2 } from "lucide-react";

export default function JobDescriptionEditor({ 
  userId, 
  initialJobDescription 
}: { 
  userId: string;
  initialJobDescription: string | null;
}) {
  const [jobDescription, setJobDescription] = useState(initialJobDescription || "");
  const [saving, setSaving] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const saveJobDescription = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/employees/${userId}/job-description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      if (res.ok) {
        setMessage({ text: "Saved successfully", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: "Failed to save", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Error saving", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const autoCategorize = async () => {
    if (!jobDescription) {
      setMessage({ text: "Please enter and save a Job Description first.", type: "error" });
      return;
    }
    setCategorizing(true);
    setMessage(null);
    try {
      // Ensure we save the latest text first
      await fetch(`/api/employees/${userId}/job-description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const res = await fetch("/api/productivity/auto-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ text: data.message || "Categorization complete!", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to categorize", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Error running AI", type: "error" });
    } finally {
      setCategorizing(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
      
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
        <Briefcase className="w-5 h-5 text-purple-400" /> Job Description
      </h2>
      
      <div className="space-y-4 relative z-10">
        <p className="text-sm text-gray-400">
          Set the employee's role to help the AI accurately determine which applications are productive or unproductive for them.
        </p>
        
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="e.g. Software Engineer. Works primarily in VS Code, terminal, and GitHub. Uses Slack for communication."
          className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
        />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={saveJobDescription}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
            >
              {saving ? "Saving..." : "Save Role"}
            </button>
            {message && (
              <span className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
                {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {message.text}
              </span>
            )}
          </div>
          
          <button 
            onClick={autoCategorize}
            disabled={categorizing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {categorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            {categorizing ? "Analyzing Apps..." : "Auto-Categorize with AI"}
          </button>
        </div>
      </div>
    </div>
  );
}
