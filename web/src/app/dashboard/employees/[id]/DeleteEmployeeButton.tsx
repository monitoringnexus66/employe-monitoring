"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteEmployeeButton({ userId, userName }: { userId: string, userName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to completely remove ${userName} from your organization? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete employee");
        setLoading(false);
        return;
      }

      router.push("/dashboard/employees");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? "Deleting..." : "Remove Employee"}
    </button>
  );
}
