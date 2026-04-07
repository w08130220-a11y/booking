"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { zhTW } from "date-fns/locale";
import { format, startOfDay } from "date-fns";
import { BookingStepper } from "@/components/booking/stepper";
import { formatDate } from "@/lib/utils";
import "react-day-picker/style.css";

type ShootType = "static" | "dynamic" | null;

export default function HomePage() {
  const router = useRouter();
  const [shootType, setShootType] = useState<ShootType>(null);
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [prices, setPrices] = useState({ static: 1500, dynamic: 2500 });
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

    fetch("/api/admin/settings/public")
      .then((r) => r.json())
      .then((data) => {
        if (data.pricePerHourStatic) {
          setPrices({ static: data.pricePerHourStatic, dynamic: data.pricePerHourDynamic });
        }
      })
      .catch(() => {});
  }, []);

  const handleSelect = useCallback((triggerDate: Date | undefined) => {
    if (triggerDate) setSelected(triggerDate);
  }, []);

  function handleNext() {
    if (!shootType || !selected) return;
    const dateStr = format(selected, "yyyy-MM-dd");
    router.push(`/book/slots?date=${dateStr}&type=${shootType}`);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <h1 className="text-xl font-bold text-zinc-900">Bubu Studio</h1>
          <p className="text-sm text-zinc-500 mt-0.5">場地租借預約</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BookingStepper current={1} />

        {/* Step 1: Shoot Type Selection */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">選擇拍攝類型</h2>
          <p className="text-sm text-zinc-500 mb-5">請先選擇您需要的拍攝方式</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShootType("static")}
              className={`relative flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                shootType === "static"
                  ? "border-blue-600 bg-blue-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span className="text-3xl mb-3">📷</span>
              <span className={`text-base font-semibold ${shootType === "static" ? "text-blue-700" : "text-zinc-900"}`}>
                平面拍攝
              </span>
              <span className={`text-xl font-bold mt-2 ${shootType === "static" ? "text-blue-600" : "text-zinc-700"}`}>
                NT$ {prices.static.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400 mt-0.5">/ 小時</span>
              {shootType === "static" && (
                <span className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>

            <button
              onClick={() => setShootType("dynamic")}
              className={`relative flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                shootType === "dynamic"
                  ? "border-blue-600 bg-blue-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span className="text-3xl mb-3">🎬</span>
              <span className={`text-base font-semibold ${shootType === "dynamic" ? "text-blue-700" : "text-zinc-900"}`}>
                動態拍攝
              </span>
              <span className={`text-xl font-bold mt-2 ${shootType === "dynamic" ? "text-blue-600" : "text-zinc-700"}`}>
                NT$ {prices.dynamic.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400 mt-0.5">/ 小時</span>
              {shootType === "dynamic" && (
                <span className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Date Selection (only show after type selected) */}
        {shootType && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">選擇預約日期</h2>
            <p className="text-sm text-zinc-500 mb-6">請選擇您希望租借場地的日期</p>
            <div className="flex justify-center">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={handleSelect}
                locale={zhTW}
                disabled={[{ before: today }, ...holidays]}
                modifiers={{ holiday: holidays }}
                modifiersClassNames={{ holiday: "line-through text-red-300" }}
              />
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              {selected ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-700">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                      shootType === "static" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {shootType === "static" ? "平面" : "動態"}
                    </span>
                    {formatDate(selected)}
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
        )}
      </main>
    </div>
  );
}
