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

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => setBooking(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">找不到預約資訊</p>
        <Link href="/book" className="text-blue-600 text-sm mt-2 inline-block">
          返回預約
        </Link>
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
        <Link href="/book" className="text-blue-600 text-sm mt-2 inline-block">
          返回預約
        </Link>
      </div>
    );
  }

  return (
    <div>
      <BookingStepper current={4} />
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm text-center">
        {/* Success icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-zinc-900 mb-1">預約成功！</h2>
        <p className="text-sm text-zinc-500 mb-6">
          確認信已寄送至 {booking.customerEmail}
        </p>

        {/* Booking details */}
        <div className="bg-zinc-50 rounded-lg p-5 text-left max-w-sm mx-auto mb-6">
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
              <span className="text-sm text-zinc-900">
                {formatTimeRange(booking.startTime, booking.endTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">姓名</span>
              <span className="text-sm text-zinc-900">{booking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">人數</span>
              <span className="text-sm text-zinc-900">{booking.numberOfPeople} 人</span>
            </div>
            {booking.totalPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">費用</span>
                <span className="text-sm font-medium text-emerald-600">NT$ {booking.totalPrice.toLocaleString()}</span>
              </div>
            )}
            {booking.totalPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">付款方式</span>
                <span className="text-sm text-zinc-900">現場付款</span>
              </div>
            )}
            {booking.notes && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">備註</span>
                <span className="text-sm text-zinc-900 text-right max-w-[60%]">
                  {booking.notes}
                </span>
              </div>
            )}
          </div>
        </div>

        <Link
          href="/book"
          className="inline-block px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          再次預約
        </Link>
      </div>
    </div>
  );
}
