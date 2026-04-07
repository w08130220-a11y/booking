"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatDate, formatTimeRange } from "@/lib/utils";
import Link from "next/link";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfPeople: number;
  shootType: string;
  notes: string | null;
  status: string;
  cancellationReason: string | null;
  emailSent: boolean;
  totalPrice: number;
  paymentStatus: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  confirmed: { label: "已確認", class: "bg-blue-50 text-blue-700" },
  completed: { label: "已完成", class: "bg-green-50 text-green-700" },
  cancelled: { label: "已取消", class: "bg-red-50 text-red-700" },
  no_show: { label: "未到", class: "bg-orange-50 text-orange-700" },
};

const paymentLabels: Record<string, { label: string; class: string }> = {
  pending: { label: "待收款", class: "bg-yellow-50 text-yellow-700" },
  paid: { label: "已收款", class: "bg-green-50 text-green-700" },
  refunded: { label: "已退款", class: "bg-red-50 text-red-700" },
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => setBooking(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function updatePayment(paymentStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      }
    } finally {
      setUpdating(false);
    }
  }

  async function updateStatus(status: string) {
    if (status === "cancelled" && !confirm("確定要取消此預約嗎？")) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm("確定要刪除此預約嗎？此操作無法復原。")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    router.push("/admin/bookings");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12 text-zinc-500">
        找不到此預約
        <Link href="/admin/bookings" className="text-blue-600 ml-2">
          返回列表
        </Link>
      </div>
    );
  }

  const s = statusLabels[booking.status] || { label: booking.status, class: "bg-zinc-100 text-zinc-700" };

  const statusActions = [
    { key: "confirmed", label: "已確認", style: "bg-blue-600 text-white hover:bg-blue-700" },
    { key: "completed", label: "已完成", style: "bg-green-600 text-white hover:bg-green-700" },
    { key: "no_show", label: "未到", style: "bg-orange-500 text-white hover:bg-orange-600" },
    { key: "cancelled", label: "已取消", style: "bg-red-500 text-white hover:bg-red-600" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bookings" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">預約詳情</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full ${s.class}`}>{s.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking info */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">預約資訊</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">預約編號</dt>
              <dd className="text-sm text-zinc-900 font-mono">{booking.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">日期</dt>
              <dd className="text-sm text-zinc-900">{formatDate(booking.date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">時段</dt>
              <dd className="text-sm text-zinc-900">{formatTimeRange(booking.startTime, booking.endTime)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">人數</dt>
              <dd className="text-sm text-zinc-900">{booking.numberOfPeople} 人</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">拍攝類型</dt>
              <dd>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  booking.shootType === "dynamic" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {booking.shootType === "dynamic" ? "🎬 動態拍攝" : "📷 平面拍攝"}
                </span>
              </dd>
            </div>
            {booking.notes && (
              <div>
                <dt className="text-sm text-zinc-500 mb-1">備註</dt>
                <dd className="text-sm text-zinc-900 bg-zinc-50 rounded-lg p-3">{booking.notes}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">確認信</dt>
              <dd className="text-sm">{booking.emailSent ? "✓ 已寄送" : "✗ 未寄送"}</dd>
            </div>
          </dl>
        </div>

        {/* Payment info */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">收款資訊</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">金額</dt>
              <dd className="text-lg font-bold text-zinc-900">NT$ {booking.totalPrice.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-zinc-500">收款狀態</dt>
              <dd>
                <span className={`text-xs px-2.5 py-1 rounded-full ${(paymentLabels[booking.paymentStatus] || { class: "bg-zinc-100 text-zinc-700" }).class}`}>
                  {(paymentLabels[booking.paymentStatus] || { label: booking.paymentStatus }).label}
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-2">
            {booking.paymentStatus !== "paid" && (
              <button
                onClick={() => updatePayment("paid")}
                disabled={updating}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                標記已收款
              </button>
            )}
            {booking.paymentStatus === "paid" && (
              <button
                onClick={() => updatePayment("refunded")}
                disabled={updating}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
              >
                標記已退款
              </button>
            )}
            {booking.paymentStatus !== "pending" && (
              <button
                onClick={() => updatePayment("pending")}
                disabled={updating}
                className="px-4 py-2 border border-zinc-300 text-zinc-600 rounded-lg text-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                重設為待收款
              </button>
            )}
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">客戶資訊</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">姓名</dt>
              <dd className="text-sm text-zinc-900">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Email</dt>
              <dd className="text-sm text-zinc-900">{booking.customerEmail}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">手機</dt>
              <dd className="text-sm text-zinc-900">{booking.customerPhone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">建立時間</dt>
              <dd className="text-sm text-zinc-900">
                {new Date(booking.createdAt).toLocaleString("zh-TW")}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 mt-6">
        <h3 className="font-semibold text-zinc-900 mb-4">變更狀態</h3>
        <div className="flex flex-wrap gap-2">
          {statusActions.map((action) => (
            action.key !== booking.status && (
              <button
                key={action.key}
                onClick={() => updateStatus(action.key)}
                disabled={updating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${action.style}`}
              >
                {action.label}
              </button>
            )
          ))}
        </div>
        <div className="border-t border-zinc-200 mt-4 pt-4">
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
          >
            刪除預約
          </button>
        </div>
      </div>
    </div>
  );
}
