import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new passwords are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Currently the system uses plain text passwords despite the column name 'passwordHash'
    if (user.passwordHash !== currentPassword) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    // Update password
    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: newPassword }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
