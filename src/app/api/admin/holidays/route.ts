import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookie } from "@/lib/auth";
import { holidayCreateSchema } from "@/lib/validations";

export async function GET() {
  const admin = await getAuthFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const holidays = await prisma.holiday.findMany({
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ holidays });
}

export async function POST(request: NextRequest) {
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

  const result = holidayCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "資料格式錯誤" }, { status: 400 });
  }

  const [year, month, day] = result.data.date.split("-").map(Number);

  try {
    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(year, month - 1, day),
        description: result.data.description || null,
      },
    });
    return NextResponse.json(holiday, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "此日期已設為休假日" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getAuthFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "請提供 ID" }, { status: 400 });
  }

  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
