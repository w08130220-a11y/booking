import { prisma } from "@/lib/prisma";
import { formatDateShort, formatTimeRange } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [todayCount, weekCount, totalCount, cancelledCount, todayBookings] =
    await Promise.all([
      prisma.booking.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { not: "cancelled" } },
      }),
      prisma.booking.count({
        where: { date: { gte: todayStart, lte: weekEnd }, status: { not: "cancelled" } },
      }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "cancelled" } }),
      prisma.booking.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { not: "cancelled" } },
        orderBy: { startTime: "asc" },
      }),
    ]);

  return { todayCount, weekCount, totalCount, cancelledCount, todayBookings };
}

export default async function AdminDashboard() {
  const { todayCount, weekCount, totalCount, cancelledCount, todayBookings } =
    await getStats();

  const cancelRate = totalCount > 0 ? ((cancelledCount / totalCount) * 100).toFixed(1) : "0";

  const stats = [
    { label: "今日預約", value: todayCount, color: "text-blue-600" },
    { label: "本週預約", value: weekCount, color: "text-emerald-600" },
    { label: "總預約數", value: totalCount, color: "text-zinc-900" },
    { label: "取消率", value: `${cancelRate}%`, color: "text-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">儀表板</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-zinc-200 rounded-xl p-5"
          >
            <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Today's bookings */}
      <div className="bg-white border border-zinc-200 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">今日預約</h2>
          <Link href="/admin/bookings" className="text-sm text-blue-600 hover:text-blue-700">
            查看全部
          </Link>
        </div>
        {todayBookings.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">今日無預約</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {todayBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{booking.customerName}</p>
                  <p className="text-xs text-zinc-500">
                    {formatTimeRange(booking.startTime, booking.endTime)} · {booking.numberOfPeople} 人
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {booking.status === "confirmed" ? "已確認" : booking.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
