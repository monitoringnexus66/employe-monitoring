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

  // Fetch Company Branding (Tenant) if user belongs to a tenant
  let tenantLogo = null;
  let tenantName = null;
  if (session.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, logoBase64: true }
    });
    tenantLogo = tenant?.logoBase64;
    tenantName = tenant?.name;
  }

  // Determine final branding: Tenant logo overrides System logo.
  const branding = {
    appName: tenantName || systemSettings?.appName || "NexusTrack",
    logoBase64: tenantLogo || systemSettings?.logoBase64 || null
  };

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
