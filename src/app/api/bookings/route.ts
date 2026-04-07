import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingCreateSchema } from "@/lib/validations";
import { sendBookingConfirmation } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { getAuthFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const result = bookingCreateSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => i.message);
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  const data = result.data;

  // Verify all slots in the range are still available
  const [year, month, day] = data.date.split("-").map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

  // Get all existing non-cancelled bookings for this date
  const existingBookings = await prisma.booking.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: "cancelled" },
    },
    select: { startTime: true, endTime: true },
  });

  // Check if requested range overlaps with any existing booking
  const hasOverlap = existingBookings.some((b) => {
    return b.startTime < data.endTime && b.endTime > data.startTime;
  });

  if (hasOverlap) {
    return NextResponse.json({ error: "所選時段中有部分已被預約，請重新選擇" }, { status: 409 });
  }

  // Calculate price based on shoot type
  let settings = await prisma.studioSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.studioSettings.create({ data: { id: "default", pricePerHourStatic: 1500, pricePerHourDynamic: 2500 } });
  }
  const shootType = data.shootType || "static";
  const pricePerHour = shootType === "dynamic" ? settings.pricePerHourDynamic : settings.pricePerHourStatic;
  const startHour = parseInt(data.startTime.split(":")[0]);
  const endHour = parseInt(data.endTime.split(":")[0]) || 24;
  const hours = endHour - startHour;
  const totalPrice = hours * pricePerHour;

  try {
    const booking = await prisma.booking.create({
      data: {
        date: new Date(year, month - 1, day),
        startTime: data.startTime,
        endTime: data.endTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        numberOfPeople: data.numberOfPeople,
        shootType,
        notes: data.notes ? `[末五碼: ${data.lastFiveDigits}] ${data.notes}` : `[末五碼: ${data.lastFiveDigits}]`,
        totalPrice,
      },
    });

    // Send confirmation email (must await in serverless)
    const emailSent = await sendBookingConfirmation({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      date: formatDate(booking.date),
      startTime: booking.startTime,
      endTime: booking.endTime,
      numberOfPeople: booking.numberOfPeople,
      shootType: booking.shootType,
      totalPrice: booking.totalPrice,
      notes: booking.notes,
      bookingId: booking.id,
    });

    if (emailSent) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { emailSent: true },
      }).catch(console.error);
    }

    return NextResponse.json({ id: booking.id }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "此時段已被預約，請選擇其他時段" }, { status: 409 });
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  // Admin only
  const admin = await getAuthFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { customerEmail: { contains: search } },
      { customerPhone: { contains: search } },
    ];
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({
    bookings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
