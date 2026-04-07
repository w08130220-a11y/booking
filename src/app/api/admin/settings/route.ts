import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookie } from "@/lib/auth";

export async function GET() {
  const admin = await getAuthFromCookie();
  if (!admin) return NextResponse.json({ error: "未授權" }, { status: 401 });

  let settings = await prisma.studioSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.studioSettings.create({
      data: { id: "default", pricePerHour: 500 },
    });
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const admin = await getAuthFromCookie();
  if (!admin) return NextResponse.json({ error: "未授權" }, { status: 401 });

  const body = await request.json();
  const pricePerHour = parseInt(body.pricePerHour);
  if (isNaN(pricePerHour) || pricePerHour < 0) {
    return NextResponse.json({ error: "請輸入有效的價格" }, { status: 400 });
  }

  const settings = await prisma.studioSettings.upsert({
    where: { id: "default" },
    update: { pricePerHour },
    create: { id: "default", pricePerHour },
  });

  return NextResponse.json(settings);
}
