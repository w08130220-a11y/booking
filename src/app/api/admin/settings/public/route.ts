import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let settings = await prisma.studioSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.studioSettings.create({
      data: { id: "default", pricePerHour: 500 },
    });
  }
  return NextResponse.json({ pricePerHour: settings.pricePerHour });
}
