import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import OpenAI from "openai";
import { ProductivityCategory } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN" || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured." }, { status: 500 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get the employee's job description
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: userId,
          tenantId: session.tenantId
        }
      }
    });

    if (!membership || !membership.jobDescription) {
      return NextResponse.json({ error: "Employee does not have a job description." }, { status: 400 });
    }

    // Get all unique apps used by this employee
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        tenantId: session.tenantId,
        device: { userId }
      },
      select: { appName: true },
      distinct: ['appName']
    });

    if (activityLogs.length === 0) {
      return NextResponse.json({ message: "No apps to categorize." });
    }

    const appNames = activityLogs.map(log => log.appName);

    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey
    });

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `You are an expert Productivity Analyst. Given an employee's Job Description and a list of applications they use, categorize EACH application as PRODUCTIVE, UNPRODUCTIVE, or NEUTRAL. 
          Return ONLY a raw JSON array of objects with keys "appName" and "category". Do not include markdown formatting or backticks.` 
        },
        { 
          role: "user", 
          content: `Job Description: ${membership.jobDescription}\nApps:\n${appNames.join('\n')}` 
        }
      ],
      model: "deepseek-chat",
    });

    const responseText = completion.choices[0].message.content?.trim() || "[]";
    let categories: any[] = [];
    
    try {
      // Strip markdown code blocks if the LLM adds them
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      categories = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse DeepSeek response", responseText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Save to database
    let count = 0;
    for (const item of categories) {
      if (['PRODUCTIVE', 'UNPRODUCTIVE', 'NEUTRAL'].includes(item.category)) {
        await prisma.employeeAppCategory.upsert({
          where: {
            userId_tenantId_appName: {
              userId,
              tenantId: session.tenantId,
              appName: item.appName
            }
          },
          update: {
            category: item.category as ProductivityCategory
          },
          create: {
            userId,
            tenantId: session.tenantId,
            appName: item.appName,
            category: item.category as ProductivityCategory
          }
        });
        count++;
      }
    }

    return NextResponse.json({ message: `Successfully categorized ${count} apps.`, count });
  } catch (error) {
    console.error("Error auto-categorizing apps:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
