"use client";

import { useState, useEffect } from "react";

interface SlotItem {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const dayLabels = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

export default function AdminSchedulePage() {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/schedule")
      .then((r) => r.json())
      .then((data) => setSlots(data.schedule || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addSlot(dayOfWeek: number) {
    setSlots((prev) => [
      ...prev,
      { dayOfWeek, startTime: "09:00", endTime: "10:30", isActive: true },
    ]);
  }

  function removeSlot(dayOfWeek: number, index: number) {
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const targetSlot = daySlots[index];
    setSlots((prev) => prev.filter((s) => s !== targetSlot));
  }

  function updateSlot(dayOfWeek: number, index: number, field: string, value: string | boolean) {
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const targetSlot = daySlots[index];
    setSlots((prev) =>
      prev.map((s) => (s === targetSlot ? { ...s, [field]: value } : s))
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (res.ok) {
        setMessage("儲存成功！");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("儲存失敗");
      }
    } catch {
      setMessage("網路錯誤");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">時段設定</h1>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day);
          return (
            <div
              key={day}
              className="bg-white border border-zinc-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">{dayLabels[day]}</h3>
                <button
                  onClick={() => addSlot(day)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + 新增時段
                </button>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-4">未設定時段</p>
              ) : (
                <div className="space-y-2">
                  {daySlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(day, idx, "startTime", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-zinc-300 rounded text-xs"
                      />
                      <span className="text-xs text-zinc-400">~</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(day, idx, "endTime", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-zinc-300 rounded text-xs"
                      />
                      <button
                        onClick={() => updateSlot(day, idx, "isActive", !slot.isActive)}
                        className={`w-8 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                          slot.isActive ? "bg-green-500" : "bg-zinc-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                            slot.isActive ? "left-3.5" : "left-0.5"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => removeSlot(day, idx)}
                        className="text-zinc-400 hover:text-red-500 text-sm flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
