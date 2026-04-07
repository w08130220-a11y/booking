"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { zhTW } from "date-fns/locale";
import { format, startOfDay } from "date-fns";
import { BookingStepper } from "@/components/booking/stepper";
import { formatDate } from "@/lib/utils";
import "react-day-picker/style.css";

export default function BookDatePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const today = startOfDay(new Date());

  useEffect(() => {
    fetch("/api/admin/holidays-public")
      .then((r) => r.json())
      .then((data) => {
        if (data.holidays) {
          setHolidays(data.holidays.map((h: { date: string }) => new Date(h.date)));
        }
      })
      .catch(() => {});
  }, []);

  const handleSelect = useCallback((triggerDate: Date | undefined) => {
    console.log("onSelect fired:", triggerDate);
    if (triggerDate) {
      setSelected(triggerDate);
    }
  }, []);

  function handleNext() {
    if (!selected) return;
    const dateStr = format(selected, "yyyy-MM-dd");
    router.push(`/book/slots?date=${dateStr}`);
  }

  return (
    <div>
      <BookingStepper current={1} />
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">選擇預約日期</h2>
        <p className="text-sm text-zinc-500 mb-6">請選擇您希望租借場地的日期</p>
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={zhTW}
            disabled={[
              { before: today },
              ...holidays,
            ]}
            modifiers={{
              holiday: holidays,
            }}
            modifiersClassNames={{
              holiday: "line-through text-red-300",
            }}
          />
        </div>

        {/* Selected date + next button */}
        <div className="mt-6 border-t border-zinc-100 pt-5">
          {selected ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-700">
                已選擇：<span className="font-medium text-zinc-900">{formatDate(selected)}</span>
              </p>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                下一步
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center">請先選擇日期</p>
          )}
        </div>
      </div>
    </div>
  );
}
