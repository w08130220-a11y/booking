"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const [priceStatic, setPriceStatic] = useState(1500);
  const [priceDynamic, setPriceDynamic] = useState(2500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setPriceStatic(data.pricePerHourStatic || 1500);
        setPriceDynamic(data.pricePerHourDynamic || 2500);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerHourStatic: priceStatic,
          pricePerHourDynamic: priceDynamic,
        }),
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
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">價格設定</h1>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 max-w-md">
        <h3 className="font-semibold text-zinc-900 mb-5">場地租借費用</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              📷 平面拍攝（NT$ / 小時）
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">$</span>
              <input
                type="number"
                value={priceStatic}
                onChange={(e) => setPriceStatic(parseInt(e.target.value) || 0)}
                min={0}
                className="w-40 px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-zinc-500">/ 小時</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              🎬 動態拍攝（NT$ / 小時）
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">$</span>
              <input
                type="number"
                value={priceDynamic}
                onChange={(e) => setPriceDynamic(parseInt(e.target.value) || 0)}
                min={0}
                className="w-40 px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-zinc-500">/ 小時</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-4">
          預約時系統會自動根據拍攝類型和時數計算總金額
        </p>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {message && (
            <span className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
