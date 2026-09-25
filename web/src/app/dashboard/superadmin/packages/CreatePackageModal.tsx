"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export default function CreatePackageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      maxAccounts: parseInt(formData.get("maxAccounts") as string),
      monthlyPrice: parseFloat(formData.get("monthlyPrice") as string),
      hasCCTV: formData.get("hasCCTV") === "on",
    };

    try {
      const res = await fetch("/api/superadmin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert("Failed to create package");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
      >
        <Plus className="w-4 h-4" />
        Create Package
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#131722] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Create New Package</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Package Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Starter Plan"
                  className="w-full px-4 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Max Accounts (Limit)</label>
                <input
                  type="number"
                  name="maxAccounts"
                  required
                  min="1"
                  placeholder="e.g. 5"
                  className="w-full px-4 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  name="monthlyPrice"
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 49.99"
                  className="w-full px-4 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <input
                  type="checkbox"
                  id="hasCCTV"
                  name="hasCCTV"
                  className="w-4 h-4 rounded bg-black/50 border-white/20 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="hasCCTV" className="text-sm font-medium text-white cursor-pointer">
                  Includes Live CCTV Broadcast
                  <p className="text-xs text-blue-300 font-normal mt-0.5">Allow workspaces in this package to view live desktop streams.</p>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? "Creating..." : "Save Package"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
