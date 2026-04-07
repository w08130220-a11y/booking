import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookie } from "@/lib/auth";
import { scheduleUpdateSchema } from "@/lib/validations";

export async function GET() {
  const admin = await getAuthFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const schedule = await prisma.weeklySchedule.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ schedule });
}

export async function PUT(request: NextRequest) {
  const admin = await getAuthFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const result = scheduleUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "資料格式錯誤" }, { status: 400 });
  }

  // Delete all existing and re-insert
  await prisma.weeklySchedule.deleteMany();

  for (const slot of result.data.slots) {
    await prisma.weeklySchedule.create({
      data: {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
      },
    });
  }

  return NextResponse.json({ success: true });
}
