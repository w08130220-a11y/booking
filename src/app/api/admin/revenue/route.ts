import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookie } from "@/lib/auth";

function getTaipeiNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
}

export async function GET(request: NextRequest) {
  const admin = await getAuthFromCookie();
  if (!admin) return NextResponse.json({ error: "未授權" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const now = getTaipeiNow();
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

  // Today's stats
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const todayBookings = await prisma.booking.findMany({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      status: { not: "cancelled" },
    },
    select: { totalPrice: true, paymentStatus: true },
  });

  const todayExpected = todayBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const todayCollected = todayBookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Monthly stats
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const monthlyBookings = await prisma.booking.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      status: { not: "cancelled" },
    },
    select: { date: true, totalPrice: true, paymentStatus: true },
  });

  const monthlyExpected = monthlyBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const monthlyCollected = monthlyBookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Daily breakdown for the month
  const dailyMap = new Map<string, { expected: number; collected: number; count: number }>();
  for (const b of monthlyBookings) {
    const d = b.date.toISOString().split("T")[0];
    const entry = dailyMap.get(d) || { expected: 0, collected: 0, count: 0 };
    entry.expected += b.totalPrice;
    entry.count += 1;
    if (b.paymentStatus === "paid") entry.collected += b.totalPrice;
    dailyMap.set(d, entry);
  }

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Total all-time revenue
  const allTimeResult = await prisma.booking.aggregate({
    where: { status: { not: "cancelled" }, paymentStatus: "paid" },
    _sum: { totalPrice: true },
  });
  const totalRevenue = allTimeResult._sum.totalPrice || 0;

  const allTimeExpectedResult = await prisma.booking.aggregate({
    where: { status: { not: "cancelled" } },
    _sum: { totalPrice: true },
  });
  const totalExpected = allTimeExpectedResult._sum.totalPrice || 0;

  return NextResponse.json({
    today: { expected: todayExpected, collected: todayCollected },
    monthly: {
      year,
      month,
      expected: monthlyExpected,
      collected: monthlyCollected,
      daily: dailyBreakdown,
    },
    allTime: { revenue: totalRevenue, expected: totalExpected },
  });
}
