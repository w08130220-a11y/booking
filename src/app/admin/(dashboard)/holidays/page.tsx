"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

interface Holiday {
  id: string;
  date: string;
  description: string | null;
}

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchHolidays() {
    try {
      const res = await fetch("/api/admin/holidays");
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch {
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHolidays();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;

    setAdding(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, description: newDesc || undefined }),
      });

      if (res.ok) {
        setNewDate("");
        setNewDesc("");
        fetchHolidays();
      } else {
        const data = await res.json();
        setMessage(data.error || "新增失敗");
      }
    } catch {
      setMessage("網路錯誤");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此休假日嗎？")) return;
    await fetch(`/api/admin/holidays?id=${id}`, { method: "DELETE" });
    fetchHolidays();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">休假日管理</h1>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-white border border-zinc-200 rounded-xl p-5 mb-6"
      >
        <h3 className="font-semibold text-zinc-900 mb-4">新增休假日</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">日期</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-zinc-500 mb-1">說明（選填）</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="例如：國慶日"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            {adding ? "新增中..." : "新增"}
          </button>
        </div>
        {message && (
          <p className="text-sm text-red-500 mt-2">{message}</p>
        )}
      </form>

      {/* Holiday list */}
      <div className="bg-white border border-zinc-200 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h3 className="font-semibold text-zinc-900">已設定的休假日</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">尚未設定休假日</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm text-zinc-900">{formatDate(h.date)}</p>
                  {h.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{h.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
