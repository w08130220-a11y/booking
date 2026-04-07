import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 取得台北時間
function getTaipeiNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
}

export async function GET(request: NextRequest) {
  const dateStr = request.nextUrl.searchParams.get("date");
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "請提供有效日期" }, { status: 400 });
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();

  // Check if it's a holiday
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

  const holiday = await prisma.holiday.findFirst({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  if (holiday) {
    return NextResponse.json({ slots: [], holiday: holiday.description || "休假日" });
  }

  // Get base weekly schedule
  const weeklySlots = await prisma.weeklySchedule.findMany({
    where: { dayOfWeek, isActive: true },
    orderBy: { startTime: "asc" },
  });

  // Get overrides for this date
  const overrides = await prisma.slotOverride.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  // Apply overrides
  const overrideMap = new Map(overrides.map((o) => [o.startTime, o]));

  let availableSlots = weeklySlots
    .filter((slot) => {
      const override = overrideMap.get(slot.startTime);
      return !override || override.isActive;
    })
    .map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime }));

  // Add extra slots from overrides
  for (const override of overrides) {
    if (override.isActive && !weeklySlots.find((s) => s.startTime === override.startTime)) {
      availableSlots.push({ startTime: override.startTime, endTime: override.endTime });
    }
  }

  // Sort by start time
  availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Mark slots that overlap with existing bookings as booked
  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: "cancelled" },
    },
    select: { startTime: true, endTime: true },
  });

  // 判斷是否為今天（台北時間）
  const now = getTaipeiNow();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = dateStr === todayStr;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const slotsWithStatus = availableSlots.map((slot) => {
    const booked = bookings.some((b) => b.startTime < slot.endTime && b.endTime > slot.startTime);
    // 今天已過的時段標記為 passed
    const passed = isToday && slot.startTime <= currentTime;
    return { ...slot, booked, passed };
  });

  return NextResponse.json({ slots: slotsWithStatus });
}
