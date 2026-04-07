"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDateShort, formatTimeRange } from "@/lib/utils";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfPeople: number;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  confirmed: { label: "已確認", class: "bg-blue-50 text-blue-700" },
  completed: { label: "已完成", class: "bg-green-50 text-green-700" },
  cancelled: { label: "已取消", class: "bg-red-50 text-red-700" },
  no_show: { label: "未到", class: "bg-orange-50 text-orange-700" },
};

const tabs = [
  { key: "all", label: "全部" },
  { key: "confirmed", label: "已確認" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  function handleTabChange(newStatus: string) {
    setStatus(newStatus);
    setPage(1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">預約管理</h1>

      {/* Tabs + Search */}
      <div className="bg-white border border-zinc-200 rounded-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 gap-4 flex-wrap">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  status === tab.key
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="搜尋姓名、Email、手機..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-zinc-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">無預約紀錄</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
                    <th className="px-5 py-3 font-medium">日期</th>
                    <th className="px-5 py-3 font-medium">時段</th>
                    <th className="px-5 py-3 font-medium">姓名</th>
                    <th className="px-5 py-3 font-medium">手機</th>
                    <th className="px-5 py-3 font-medium">金額</th>
                    <th className="px-5 py-3 font-medium">收款</th>
                    <th className="px-5 py-3 font-medium">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {bookings.map((b) => {
                    const s = statusLabels[b.status] || { label: b.status, class: "bg-zinc-100 text-zinc-700" };
                    return (
                      <tr key={b.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/bookings/${b.id}`} className="text-sm text-blue-600 hover:text-blue-700">
                            {formatDateShort(b.date)}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-700">
                          {formatTimeRange(b.startTime, b.endTime)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-900 font-medium">{b.customerName}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-600">{b.customerPhone}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-700 font-medium">NT${b.totalPrice.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            b.paymentStatus === "paid" ? "bg-green-50 text-green-700" :
                            b.paymentStatus === "refunded" ? "bg-red-50 text-red-700" :
                            "bg-yellow-50 text-yellow-700"
                          }`}>
                            {b.paymentStatus === "paid" ? "已收" : b.paymentStatus === "refunded" ? "退款" : "待收"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-1 rounded-full ${s.class}`}>{s.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {bookings.map((b) => {
                const s = statusLabels[b.status] || { label: b.status, class: "bg-zinc-100 text-zinc-700" };
                return (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{b.customerName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatDateShort(b.date)} · {formatTimeRange(b.startTime, b.endTime)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${s.class}`}>{s.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
                <p className="text-xs text-zinc-500">共 {total} 筆</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm rounded border border-zinc-300 disabled:opacity-30"
                  >
                    上一頁
                  </button>
                  <span className="text-sm text-zinc-600 py-1">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm rounded border border-zinc-300 disabled:opacity-30"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
