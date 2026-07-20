import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch System Branding (Super Admin)
  const systemSettings = await prisma.systemSettings.findUnique({
    where: { id: "global" }
  });

  // Determine final branding (defaulting to CHIIO OS)
  const branding = {
    appName: systemSettings?.appName || "CHIIO OS",
    logoBase64: systemSettings?.logoBase64 || null
  };

  // Only non-SuperAdmins get their tenant branding overrides
  if (session.role !== "SUPERADMIN" && session.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, logoBase64: true }
    });
    if (tenant?.logoBase64) branding.logoBase64 = tenant.logoBase64;
    if (tenant?.name) branding.appName = tenant.name;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar role={session.role} hasCCTV={session.hasCCTV} branding={branding} />
      <main className="flex-1 ml-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="h-full min-h-screen bg-background/95 backdrop-blur-3xl p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
