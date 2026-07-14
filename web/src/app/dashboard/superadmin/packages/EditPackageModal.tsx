"use client";

import { useState } from "react";
import { Edit2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditPackageModal({ pkg }: { pkg: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: pkg.id,
      name: formData.get("name"),
      maxAccounts: parseInt(formData.get("maxAccounts") as string),
      monthlyPrice: parseFloat(formData.get("monthlyPrice") as string),
      hasCCTV: formData.get("hasCCTV") === "on",
    };

    try {
      const res = await fetch("/api/superadmin/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert("Failed to update package");
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
        className="text-blue-400 hover:underline flex items-center gap-1"
      >
        <Edit2 className="w-3 h-3" /> Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-secondary/90 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Edit Package</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Package Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={pkg.name}
                  placeholder="e.g. Starter Plan"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Max Accounts (Limit)</label>
                <input
                  type="number"
                  name="maxAccounts"
                  required
                  min="1"
                  defaultValue={pkg.maxAccounts}
                  placeholder="e.g. 5"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  name="monthlyPrice"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={pkg.monthlyPrice}
                  placeholder="e.g. 49.99"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <input
                  type="checkbox"
                  id={`hasCCTV-${pkg.id}`}
                  name="hasCCTV"
                  defaultChecked={pkg.hasCCTV}
                  className="w-4 h-4 rounded bg-black/50 border-white/20 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor={`hasCCTV-${pkg.id}`} className="text-sm font-medium text-white cursor-pointer">
                  Includes Live CCTV Broadcast
                  <p className="text-xs text-blue-300 font-normal mt-0.5">Allow workspaces in this package to view live desktop streams.</p>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
