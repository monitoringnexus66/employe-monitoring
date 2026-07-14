import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, maxAccounts, monthlyPrice, hasCCTV } = await req.json();

    if (!name || isNaN(maxAccounts) || isNaN(monthlyPrice)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const pkg = await prisma.package.create({
      data: {
        name,
        maxAccounts: parseInt(maxAccounts),
        monthlyPrice: parseFloat(monthlyPrice),
        hasCCTV: !!hasCCTV,
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, name, maxAccounts, monthlyPrice, hasCCTV } = await req.json();

    if (!id || !name || isNaN(maxAccounts) || isNaN(monthlyPrice)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        name,
        maxAccounts: parseInt(maxAccounts),
        monthlyPrice: parseFloat(monthlyPrice),
        hasCCTV: !!hasCCTV,
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
