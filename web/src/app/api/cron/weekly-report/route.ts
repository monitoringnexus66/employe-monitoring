import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// This endpoint is designed to be hit by a Cron Job (e.g. Vercel Cron)
// In production, we'd add an Authorization header check here to verify the cron secret.
export async function GET(req: Request) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tenants = await prisma.tenant.findMany({
      include: {
        memberships: {
          where: { role: "ADMIN" },
          include: { user: true }
        }
      }
    });

    for (const tenant of tenants) {
      if (tenant.memberships.length === 0) continue; // No admins to email

      // Fetch 7-day stats
      const logs = await prisma.activityLog.groupBy({
        by: ['appName'],
        where: { tenantId: tenant.id, timestamp: { gte: sevenDaysAgo } },
        _sum: { durationSeconds: true }
      });

      const categories = await prisma.appCategory.findMany({ where: { tenantId: tenant.id } });

      let totalTime = 0;
      let productiveTime = 0;
      let topApp = { name: "None", time: 0 };

      logs.forEach(stat => {
        const duration = stat._sum.durationSeconds || 0;
        totalTime += duration;
        
        if (duration > topApp.time) {
          topApp = { name: stat.appName, time: duration };
        }

        const category = categories.find(c => c.appName === stat.appName)?.category || "NEUTRAL";
        if (category === "PRODUCTIVE") productiveTime += duration;
      });

      const productivityScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
      const totalHours = Math.round((totalTime / 3600) * 10) / 10;

      // Construct HTML
      const html = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Weekly Productivity Summary</h2>
          <p>Here is the weekly performance report for <strong>${tenant.name}</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 18px;">Total Hours Tracked: <strong>${totalHours}h</strong></p>
            <p style="margin: 0 0 10px 0; font-size: 18px;">Team Productivity Score: <strong>${productivityScore}%</strong></p>
            <p style="margin: 0; font-size: 18px;">Most Used Application: <strong>${topApp.name}</strong></p>
          </div>
          
          <p>Login to your dashboard to view the full visual timesheets and categorize new applications.</p>
        </div>
      `;

      // Email all admins in this tenant
      for (const adminMembership of tenant.memberships) {
        await sendEmail({
          to: adminMembership.user.email,
          subject: `Weekly Productivity Report for ${tenant.name}`,
          html
        });
      }
    }

    return NextResponse.json({ success: true, processedTenants: tenants.length });
  } catch (error) {
    console.error("Error generating weekly reports:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
