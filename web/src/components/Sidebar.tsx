"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Image as ImageIcon, Settings, Activity, LogOut, ShieldCheck, Video, PackageOpen, Building2, CalendarDays } from "lucide-react";

export function Sidebar({ 
  role, 
  hasCCTV,
  branding 
}: { 
  role: string, 
  hasCCTV?: boolean,
  branding?: { appName: string, logoBase64: string | null }
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const appName = branding?.appName || "NexusTrack";
  const logo = branding?.logoBase64;

  let navItems = [];

  if (role === "SUPERADMIN") {
    navItems = [
      { name: "Super Admin", href: "/dashboard/superadmin", icon: ShieldCheck },
      { name: "Packages", href: "/dashboard/superadmin/packages", icon: PackageOpen },
      { name: "Customers", href: "/dashboard/superadmin/customers", icon: Building2 },
      { name: "Branding", href: "/dashboard/superadmin/branding", icon: ImageIcon },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Security", href: "/dashboard/security", icon: ShieldCheck }
    ];
  } else if (role === "ADMIN") {
    navItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Employees", href: "/dashboard/employees", icon: Users },
      { name: "Screenshots", href: "/dashboard/screenshots", icon: ImageIcon },
      { name: "Productivity", href: "/dashboard/productivity", icon: Activity },
      { name: "Timesheets", href: "/dashboard/timesheets", icon: CalendarDays },
      ...(hasCCTV ? [{ name: "Live CCTV", href: "/dashboard/live", icon: Video }] : []),
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Security", href: "/dashboard/security", icon: ShieldCheck },
    ];
  } else {
    // Regular EMPLOYEE
    navItems = [
      { name: "Security", href: "/dashboard/security", icon: ShieldCheck },
    ];
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 glass border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 truncate w-40">
            {appName}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
