import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import TimesheetViewer from "./TimesheetViewer";

export const dynamic = 'force-dynamic';

export default async function TimesheetsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const tenantId = session.tenantId;

  // Fetch all employees in this tenant to populate the selector
  const employees = await prisma.user.findMany({
    where: { memberships: { some: { tenantId } } },
    select: { id: true, name: true, email: true }
  });

  // Default to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch categories to colorize the timeline
  const appCategories = await prisma.appCategory.findMany({
    where: { tenantId }
  });

  const employeeAppCategories = await prisma.employeeAppCategory.findMany({
    where: { tenantId }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-blue-500" /> Visual Timesheets
          </h1>
          <p className="text-muted-foreground mt-1">Review exact working hours and daily productivity timelines.</p>
        </div>
      </div>

      <TimesheetViewer 
        employees={employees} 
        tenantId={tenantId}
        appCategories={appCategories}
        employeeAppCategories={employeeAppCategories}
      />
    </div>
  );
}
