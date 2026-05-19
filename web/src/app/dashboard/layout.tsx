import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar role={session.role} />
      <main className="flex-1 ml-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="h-full min-h-screen bg-background/95 backdrop-blur-3xl p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
