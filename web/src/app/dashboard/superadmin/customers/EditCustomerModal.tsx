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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#131722] border border-white/10 p-6 rounded-2xl w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
              <h2 className="text-lg font-bold text-white">Edit Customer: {tenant.name}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="overflow-y-auto pr-2 -mr-1 custom-scroll flex-1">
              <form id="edit-customer-form" onSubmit={handleSubmit} className="space-y-4">
                
                {/* Contact & Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Customer ID</label>
                    <input
                      type="text"
                      name="customerId"
                      defaultValue={tenant.customerId || ""}
                      placeholder="e.g. CUST-1001"
                      className="w-full px-3.5 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Primary Contact Name</label>
                    <input
                      type="text"
                      name="primaryContactName"
                      defaultValue={tenant.primaryContactName || ""}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Primary Contact Email</label>
                    <input
                      type="email"
                      name="primaryContactEmail"
                      defaultValue={tenant.primaryContactEmail || ""}
                      placeholder="email@company.com"
                      className="w-full px-3.5 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Primary Contact Phone</label>
                    <input
                      type="text"
                      name="primaryContactPhone"
                      defaultValue={tenant.primaryContactPhone || ""}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Subscription Section */}
                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs font-bold text-slate-300 block mb-3 uppercase tracking-wider">Subscription & Plan</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Assigned Package</label>
                      <select
                        name="packageId"
                        defaultValue={tenant.packageId || ""}
                        className="w-full px-3.5 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="">No Package Assigned</option>
                        {packages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.maxAccounts} users - ${pkg.monthlyPrice})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Account Status</label>
                      <select
                        name="subscriptionStatus"
                        defaultValue={tenant.subscriptionStatus || "active"}
                        className="w-full px-3.5 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="trial">Trial</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Renewal Date</label>
                      <input
                        type="date"
                        name="renewalDate"
                        defaultValue={tenant.renewalDate ? new Date(tenant.renewalDate).toISOString().split('T')[0] : ""}
                        className="w-full px-3.5 py-2 bg-[#0B0F17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-customer-form"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? "Saving..." : "Save Customer Details"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
