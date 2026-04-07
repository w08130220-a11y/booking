"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BookingStepper } from "@/components/booking/stepper";
import { formatDate, formatTimeRange } from "@/lib/utils";
import Link from "next/link";

interface BookingData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfPeople: number;
  shootType: string;
  totalPrice: number;
  notes: string | null;
}

export default function BookConfirmPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <BookConfirmContent />
    </Suspense>
  );
}

function BookConfirmContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => setBooking(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">找不到預約資訊</p>
        <Link href="/" className="text-blue-600 text-sm mt-2 inline-block">返回預約</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <BookingStepper current={4} />
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">找不到預約資訊</p>
        <Link href="/" className="text-blue-600 text-sm mt-2 inline-block">返回預約</Link>
      </div>
    );
  }

  return (
    <div>
      <BookingStepper current={4} />

      {/* Success */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">預約成功！</h2>
        <p className="text-sm text-zinc-500">確認信已寄送至 {booking.customerEmail}</p>
      </div>

      {/* Booking details */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm mb-6">
        <h3 className="font-semibold text-zinc-900 mb-4">預約資訊</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">預約編號</span>
            <span className="text-sm text-zinc-900 font-mono">{booking.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">日期</span>
            <span className="text-sm text-zinc-900">{formatDate(booking.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">時段</span>
            <span className="text-sm text-zinc-900">{formatTimeRange(booking.startTime, booking.endTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">拍攝類型</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              booking.shootType === "dynamic" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}>
              {booking.shootType === "dynamic" ? "🎬 動態拍攝" : "📷 平面拍攝"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">人數</span>
            <span className="text-sm text-zinc-900">{booking.numberOfPeople} 人</span>
          </div>
          {booking.totalPrice > 0 && (
            <div className="flex justify-between border-t border-zinc-100 pt-3">
              <span className="text-sm font-medium text-zinc-700">應付金額</span>
              <span className="text-lg font-bold text-emerald-600">NT$ {booking.totalPrice.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment info */}
      {booking.totalPrice > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-amber-900 mb-1">💳 匯款資訊</h3>
          <p className="text-sm text-amber-700 mb-4">請於預約日前完成轉帳，並將末五碼回傳至指定信箱。</p>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">銀行</p>
                <p className="text-sm font-medium text-zinc-900">國泰世華銀行（013）</p>
              </div>
              <button
                onClick={() => handleCopy("013", "銀行代碼")}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
              >
                {copied === "銀行代碼" ? "✓ 已複製" : "複製"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">帳號</p>
                <p className="text-base font-bold text-zinc-900 tracking-wider">131-506-066-112</p>
              </div>
              <button
                onClick={() => handleCopy("131506066112", "帳號")}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
              >
                {copied === "帳號" ? "✓ 已複製" : "複製"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">匯款金額</p>
                <p className="text-base font-bold text-emerald-600">NT$ {booking.totalPrice.toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleCopy(String(booking.totalPrice), "金額")}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
              >
                {copied === "金額" ? "✓ 已複製" : "複製"}
              </button>
            </div>
          </div>

          <div className="mt-4 bg-amber-100 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-medium mb-1">轉帳完成後請回傳末五碼</p>
            <p className="text-sm text-amber-700">
              寄送至：<a href="mailto:bubu2026studio@gmail.com" className="font-medium underline">bubu2026studio@gmail.com</a>
            </p>
            <p className="text-xs text-amber-600 mt-1">
              信件主旨請填寫：預約編號 {booking.id.slice(0, 8)} — 末五碼
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          再次預約
        </Link>
      </div>
    </div>
  );
}
