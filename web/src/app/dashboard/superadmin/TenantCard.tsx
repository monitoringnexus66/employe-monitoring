"use client";

import { useState } from "react";
import { Building2, Edit2, Trash2, X, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TenantCard({ tenant }: { tenant: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit State
  const [name, setName] = useState(tenant.name);
  const [subscription, setSubscription] = useState(tenant.subscriptionStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/tenants/${tenant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subscriptionStatus: subscription })
    });
    setLoading(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/tenants/${tenant.id}`, { method: 'DELETE' });
    setLoading(false);
    setIsDeleting(false);
    router.refresh();
  };

  if (tenant.id === "system") return null; // Hide the root system tenant

  return (
    <>
      <div className="glass-card p-6 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all group relative">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            {tenant.name}
          </h2>
          <div className="flex gap-2">
            <span className={`px-2 py-1 text-xs rounded font-medium ${tenant.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}>
              {tenant.subscriptionStatus}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
           <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-center">
             <p className="text-2xl font-bold text-blue-400">{tenant._count.memberships}</p>
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Employees</p>
           </div>
           <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-center">
             <p className="text-2xl font-bold text-green-400">{tenant._count.activityLogs}</p>
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Logs</p>
           </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4 font-mono truncate" title={tenant.id}>ID: {tenant.id}</p>

        {/* Hover Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10">
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsDeleting(true)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1115] border border-white/10 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Edit Company Details</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                <input required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subscription Status</label>
                <select value={subscription} onChange={e=>setSubscription(e.target.value)} className="w-full bg-[#1c1f26] border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="trial">Trial</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a0f11] border border-red-500/20 w-full max-w-sm rounded-xl shadow-2xl p-6 text-center animate-in zoom-in-95">
            <div className="mx-auto w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Company?</h2>
            <p className="text-sm text-gray-400 mb-6">Are you absolutely sure you want to delete <strong className="text-white">{tenant.name}</strong>? This will permanently wipe all users, devices, and activity logs associated with it.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleting(false)} disabled={loading} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
