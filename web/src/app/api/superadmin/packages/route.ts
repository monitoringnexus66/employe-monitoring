import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, maxAccounts, monthlyPrice } = await req.json();

    if (!name || isNaN(maxAccounts) || isNaN(monthlyPrice)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const pkg = await prisma.package.create({
      data: {
        name,
        maxAccounts,
        monthlyPrice,
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
