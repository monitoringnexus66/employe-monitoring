"use client";

import { useState } from "react";
import { Edit2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditCustomerModal({ tenant, packages }: { tenant: any, packages: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: formData.get("customerId"),
      primaryContactName: formData.get("primaryContactName"),
      primaryContactEmail: formData.get("primaryContactEmail"),
      primaryContactPhone: formData.get("primaryContactPhone"),
      packageId: formData.get("packageId"),
      subscriptionStatus: formData.get("subscriptionStatus"),
      renewalDate: formData.get("renewalDate") ? new Date(formData.get("renewalDate") as string).toISOString() : null,
    };

    try {
      const res = await fetch(`/api/superadmin/customers/${tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert("Failed to update customer");
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
        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
      >
        <Edit2 className="w-4 h-4" /> Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-secondary/90 border border-white/10 p-6 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-full">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-muted-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6 flex-shrink-0">Edit Customer: {tenant.name}</h2>
            
            <div className="overflow-y-auto pr-2 pb-2 -mr-2">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Customer ID</label>
                <input
                  type="text"
                  name="customerId"
                  defaultValue={tenant.customerId || ""}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Primary Contact Name</label>
                <input
                  type="text"
                  name="primaryContactName"
                  defaultValue={tenant.primaryContactName || ""}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Primary Contact Email</label>
                <input
                  type="email"
                  name="primaryContactEmail"
                  defaultValue={tenant.primaryContactEmail || ""}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Primary Contact Phone</label>
                <input
                  type="text"
                  name="primaryContactPhone"
                  defaultValue={tenant.primaryContactPhone || ""}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2 pt-4 border-t border-white/10 mt-2">
                <h3 className="text-sm font-semibold text-white mb-4">Subscription Settings</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assigned Package</label>
                <select
                  name="packageId"
                  defaultValue={tenant.packageId || ""}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">No Package Assigned</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.maxAccounts} users - ${pkg.monthlyPrice})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Status</label>
                <select
                  name="subscriptionStatus"
                  defaultValue={tenant.subscriptionStatus || "active"}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="trial">Trial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Renewal Date</label>
                <input
                  type="date"
                  name="renewalDate"
                  defaultValue={tenant.renewalDate ? new Date(tenant.renewalDate).toISOString().split('T')[0] : ""}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : "Save Customer Details"}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
