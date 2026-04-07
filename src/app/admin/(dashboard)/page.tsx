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
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [todayCount, weekCount, totalCount, cancelledCount, todayBookings,
    todayRevenueData, monthRevenueData, totalRevenueData] =
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
      // Today revenue
      prisma.booking.aggregate({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { not: "cancelled" }, paymentStatus: "paid" },
        _sum: { totalPrice: true },
      }),
      // Monthly revenue
      prisma.booking.aggregate({
        where: { date: { gte: monthStart, lte: monthEnd }, status: { not: "cancelled" }, paymentStatus: "paid" },
        _sum: { totalPrice: true },
      }),
      // All-time revenue
      prisma.booking.aggregate({
        where: { status: { not: "cancelled" }, paymentStatus: "paid" },
        _sum: { totalPrice: true },
      }),
    ]);

  return {
    todayCount, weekCount, totalCount, cancelledCount, todayBookings,
    todayRevenue: todayRevenueData._sum.totalPrice || 0,
    monthRevenue: monthRevenueData._sum.totalPrice || 0,
    totalRevenue: totalRevenueData._sum.totalPrice || 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const cancelRate = stats.totalCount > 0 ? ((stats.cancelledCount / stats.totalCount) * 100).toFixed(1) : "0";

  const cards = [
    { label: "今日預約", value: stats.todayCount, color: "text-blue-600" },
    { label: "本週預約", value: stats.weekCount, color: "text-emerald-600" },
    { label: "總預約數", value: stats.totalCount, color: "text-zinc-900" },
    { label: "取消率", value: `${cancelRate}%`, color: "text-orange-500" },
  ];

  const revenueCards = [
    { label: "今日營收", value: `NT$ ${stats.todayRevenue.toLocaleString()}`, color: "text-emerald-600" },
    { label: "本月營收", value: `NT$ ${stats.monthRevenue.toLocaleString()}`, color: "text-blue-600" },
    { label: "總營業額", value: `NT$ ${stats.totalRevenue.toLocaleString()}`, color: "text-zinc-900" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">儀表板</h1>

      {/* Booking Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {cards.map((stat) => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {revenueCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
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
        {stats.todayBookings.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">今日無預約</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {stats.todayBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{booking.customerName}</p>
                  <p className="text-xs text-zinc-500">
                    {formatTimeRange(booking.startTime, booking.endTime)} · {booking.numberOfPeople} 人 · NT${booking.totalPrice.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.paymentStatus === "paid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {booking.paymentStatus === "paid" ? "已收" : "待收"}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {booking.status === "confirmed" ? "已確認" : booking.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
