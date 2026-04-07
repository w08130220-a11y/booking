import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let settings = await prisma.studioSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.studioSettings.create({
      data: { id: "default", pricePerHourStatic: 1500, pricePerHourDynamic: 2500 },
    });
  }
  return NextResponse.json({
    pricePerHourStatic: settings.pricePerHourStatic,
    pricePerHourDynamic: settings.pricePerHourDynamic,
  });
}
