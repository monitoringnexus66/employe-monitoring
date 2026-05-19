"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="w-full max-w-md p-8 bg-[#0f1115]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-600/20 rounded-full border border-blue-500/30">
             <ShieldAlert className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">NexusTrack Admin</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">Sign in to manage your workspace</p>
        
        {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              required type="email" value={email} onChange={e=>setEmail(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors" 
              placeholder="admin@nexus.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              required type="password" value={password} onChange={e=>setPassword(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors" 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
            {loading ? "Authenticating..." : "Secure Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 border-t border-white/10 pt-4">
           First time setup? Use <span className="text-gray-300 font-mono">admin@nexus.com</span> / <span className="text-gray-300 font-mono">admin</span> to initialize the Super Admin.
        </div>
      </div>
    </div>
  );
}
