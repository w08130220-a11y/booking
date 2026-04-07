import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookie } from "@/lib/auth";

export async function GET() {
  const admin = await getAuthFromCookie();
  if (!admin) return NextResponse.json({ error: "未授權" }, { status: 401 });

  let settings = await prisma.studioSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.studioSettings.create({
      data: { id: "default", pricePerHourStatic: 1500, pricePerHourDynamic: 2500 },
    });
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const admin = await getAuthFromCookie();
  if (!admin) return NextResponse.json({ error: "未授權" }, { status: 401 });

  const body = await request.json();
  const pricePerHourStatic = parseInt(body.pricePerHourStatic);
  const pricePerHourDynamic = parseInt(body.pricePerHourDynamic);

  if (isNaN(pricePerHourStatic) || pricePerHourStatic < 0 || isNaN(pricePerHourDynamic) || pricePerHourDynamic < 0) {
    return NextResponse.json({ error: "請輸入有效的價格" }, { status: 400 });
  }

  const settings = await prisma.studioSettings.upsert({
    where: { id: "default" },
    update: { pricePerHourStatic, pricePerHourDynamic },
    create: { id: "default", pricePerHourStatic, pricePerHourDynamic },
  });

  return NextResponse.json(settings);
}
