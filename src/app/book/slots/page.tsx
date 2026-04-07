"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingStepper } from "@/components/booking/stepper";
import { formatDate } from "@/lib/utils";
import { parseDate } from "@/lib/utils";
import Link from "next/link";

interface Slot {
  startTime: string;
  endTime: string;
  booked?: boolean;
}

const MIN_SLOTS = 2;

export default function BookSlotsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <BookSlotsContent />
    </Suspense>
  );
}

function BookSlotsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateStr = searchParams.get("date");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [holiday, setHoliday] = useState<string | null>(null);

  useEffect(() => {
    if (!dateStr) return;
    setLoading(true);
    fetch(`/api/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        setHoliday(data.holiday || null);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [dateStr]);

  if (!dateStr) {
    router.push("/book");
    return null;
  }

  const date = parseDate(dateStr);

  function toggleSlot(slot: Slot) {
    if (slot.booked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slot.startTime)) {
        next.delete(slot.startTime);
      } else {
        next.add(slot.startTime);
      }
      return next;
    });
  }

  // Get the merged time range from selected slots
  function getSelectedRange() {
    if (selected.size === 0) return null;
    const selectedSlots = slots.filter((s) => selected.has(s.startTime));
    selectedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const first = selectedSlots[0];
    const last = selectedSlots[selectedSlots.length - 1];
    return { startTime: first.startTime, endTime: last.endTime };
  }

  // Check if selected slots are consecutive
  function areConsecutive() {
    if (selected.size <= 1) return true;
    const selectedTimes = Array.from(selected).sort();
    const slotTimes = slots.map((s) => s.startTime);
    for (let i = 0; i < selectedTimes.length - 1; i++) {
      const currentIdx = slotTimes.indexOf(selectedTimes[i]);
      const nextIdx = slotTimes.indexOf(selectedTimes[i + 1]);
      if (nextIdx !== currentIdx + 1) return false;
    }
    return true;
  }

  const canProceed = selected.size >= MIN_SLOTS && areConsecutive();
  const range = getSelectedRange();
  const notConsecutive = selected.size >= 2 && !areConsecutive();

  function handleNext() {
    if (!canProceed || !range) return;
    router.push(
      `/book/info?date=${dateStr}&startTime=${range.startTime}&endTime=${range.endTime}&hours=${selected.size}`
    );
  }

  return (
    <div>
      <BookingStepper current={2} />
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-zinc-900">選擇時段</h2>
        </div>
        <p className="text-sm text-zinc-500">{formatDate(date)}</p>
        <p className="text-sm text-amber-600 mt-1 mb-5">
          ＊ 最少需預約 {MIN_SLOTS} 小時，請選擇連續的時段
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : holiday ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">此日期為休假日（{holiday}）</p>
            <Link
              href="/book"
              className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              選擇其他日期
            </Link>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">此日期沒有可用時段</p>
            <Link
              href="/book"
              className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              選擇其他日期
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map((slot) => {
                const isSelected = selected.has(slot.startTime);
                const isBooked = slot.booked;
                return (
                  <button
                    key={slot.startTime}
                    onClick={() => toggleSlot(slot)}
                    disabled={isBooked}
                    className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-lg border transition-colors ${
                      isBooked
                        ? "border-zinc-100 bg-zinc-50 cursor-not-allowed"
                        : isSelected
                        ? "border-blue-600 bg-blue-600 text-white cursor-pointer"
                        : "border-zinc-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                    }`}
                  >
                    <span className={`text-base font-medium ${
                      isBooked ? "text-zinc-300" : isSelected ? "text-white" : "text-zinc-900"
                    }`}>
                      {slot.startTime}
                    </span>
                    <span className={`text-xs mt-0.5 ${
                      isBooked ? "text-zinc-300" : isSelected ? "text-blue-200" : "text-zinc-400"
                    }`}>
                      {isBooked ? "已預約" : `~ ${slot.endTime}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom bar */}
            <div className="mt-6 border-t border-zinc-100 pt-5">
              {/* Error messages */}
              {notConsecutive && (
                <p className="text-sm text-red-500 mb-3 text-center">請選擇連續的時段</p>
              )}

              <div className="flex items-center justify-between">
                <Link href="/book" className="text-sm text-zinc-500 hover:text-zinc-700">
                  ← 上一步
                </Link>
                <div className="flex items-center gap-4">
                  {selected.size > 0 && range && (
                    <p className="text-sm text-zinc-600 hidden sm:block">
                      已選 <span className="font-medium text-zinc-900">{selected.size} 小時</span>
                      <span className="text-zinc-400 ml-1.5">
                        ({range.startTime} - {range.endTime})
                      </span>
                    </p>
                  )}
                  {selected.size === 0 ? (
                    <p className="text-sm text-zinc-400">請選擇至少 {MIN_SLOTS} 個時段</p>
                  ) : selected.size < MIN_SLOTS ? (
                    <p className="text-sm text-amber-500">還需選擇 {MIN_SLOTS - selected.size} 個時段</p>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      下一步
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
