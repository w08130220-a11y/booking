"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDateShort } from "@/lib/utils";

interface DailyData {
  date: string;
  expected: number;
  collected: number;
  count: number;
}

interface RevenueData {
  today: { expected: number; collected: number };
  monthly: {
    year: number;
    month: number;
    expected: number;
    collected: number;
    daily: DailyData[];
  };
  allTime: { revenue: number; expected: number };
}

const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function formatMoney(amount: number) {
  return `NT$ ${amount.toLocaleString()}`;
}

export default function AdminRevenuePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revenue?year=${year}&month=${month}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  function prevMonth() {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  }

  if (loading || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">營收報表</h1>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">營收報表</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">今日預收</p>
          <p className="text-xl font-bold text-blue-600">{formatMoney(data.today.expected)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">今日已收</p>
          <p className="text-xl font-bold text-emerald-600">{formatMoney(data.today.collected)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">本月營收</p>
          <p className="text-xl font-bold text-zinc-900">{formatMoney(data.monthly.collected)}</p>
          <p className="text-xs text-zinc-400 mt-1">預收 {formatMoney(data.monthly.expected)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">總營業額</p>
          <p className="text-xl font-bold text-orange-500">{formatMoney(data.allTime.revenue)}</p>
          <p className="text-xs text-zinc-400 mt-1">累計預收 {formatMoney(data.allTime.expected)}</p>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white border border-zinc-200 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <button onClick={prevMonth} className="px-3 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-50">
            ← 上月
          </button>
          <h2 className="font-semibold text-zinc-900">
            {year} 年 {monthNames[month - 1]}
          </h2>
          <button onClick={nextMonth} className="px-3 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-50">
            下月 →
          </button>
        </div>

        {/* Monthly summary bar */}
        <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            本月合計：預收 <span className="font-medium text-zinc-700">{formatMoney(data.monthly.expected)}</span>
            ，已收 <span className="font-medium text-emerald-600">{formatMoney(data.monthly.collected)}</span>
          </span>
          <span className="text-zinc-400">
            收款率 {data.monthly.expected > 0
              ? `${((data.monthly.collected / data.monthly.expected) * 100).toFixed(0)}%`
              : "-"}
          </span>
        </div>

        {data.monthly.daily.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">本月無預約紀錄</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
                    <th className="px-5 py-3 font-medium">日期</th>
                    <th className="px-5 py-3 font-medium">預約數</th>
                    <th className="px-5 py-3 font-medium text-right">預收款項</th>
                    <th className="px-5 py-3 font-medium text-right">已收款項</th>
                    <th className="px-5 py-3 font-medium text-right">待收</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {data.monthly.daily.map((day) => (
                    <tr key={day.date} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 text-sm text-zinc-900">{formatDateShort(day.date)}</td>
                      <td className="px-5 py-3 text-sm text-zinc-600">{day.count} 筆</td>
                      <td className="px-5 py-3 text-sm text-zinc-700 text-right">{formatMoney(day.expected)}</td>
                      <td className="px-5 py-3 text-sm text-emerald-600 font-medium text-right">{formatMoney(day.collected)}</td>
                      <td className="px-5 py-3 text-sm text-right">
                        {day.expected - day.collected > 0 ? (
                          <span className="text-orange-500">{formatMoney(day.expected - day.collected)}</span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {data.monthly.daily.map((day) => (
                <div key={day.date} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-900">{formatDateShort(day.date)}</span>
                    <span className="text-xs text-zinc-400">{day.count} 筆</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">預收 {formatMoney(day.expected)}</span>
                    <span className="text-emerald-600 font-medium">已收 {formatMoney(day.collected)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
