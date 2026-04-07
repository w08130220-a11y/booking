"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingStepper } from "@/components/booking/stepper";
import { formatDate, formatTimeRange, parseDate } from "@/lib/utils";
import Link from "next/link";

export default function BookInfoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <BookInfoContent />
    </Suspense>
  );
}

function BookInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateStr = searchParams.get("date");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const hours = searchParams.get("hours");
  const shootType = searchParams.get("type") || "static";

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    numberOfPeople: 1,
    lastFiveDigits: "",
    notes: "",
  });
  const [pricePerHour, setPricePerHour] = useState(0);

  useEffect(() => {
    fetch("/api/admin/settings/public")
      .then((r) => r.json())
      .then((data) => {
        setPricePerHour(shootType === "dynamic" ? (data.pricePerHourDynamic || 0) : (data.pricePerHourStatic || 0));
      })
      .catch(() => {});
  }, [shootType]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!dateStr || !startTime || !endTime) {
    router.push("/book");
    return null;
  }

  const date = parseDate(dateStr);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = "請輸入姓名";
    if (!form.customerEmail.trim()) errs.customerEmail = "請輸入電子信箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
      errs.customerEmail = "請輸入有效的電子信箱";
    if (!form.customerPhone.trim()) errs.customerPhone = "請輸入手機號碼";
    else if (form.customerPhone.replace(/\D/g, "").length < 8)
      errs.customerPhone = "請輸入有效的手機號碼";
    if (form.numberOfPeople < 1) errs.numberOfPeople = "至少 1 人";
    if (!form.lastFiveDigits.trim()) errs.lastFiveDigits = "請輸入轉帳末五碼";
    else if (!/^\d{5}$/.test(form.lastFiveDigits.trim())) errs.lastFiveDigits = "請輸入正確的 5 位數字";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          startTime,
          endTime,
          shootType,
          ...form,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "預約失敗，請稍後再試");
        return;
      }

      router.push(`/book/confirm?id=${data.id}`);
    } catch {
      setSubmitError("網路錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  return (
    <div>
      <BookingStepper current={3} />
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Summary bar */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">{formatDate(date)}</p>
              <p className="text-sm text-zinc-500">
                {formatTimeRange(startTime, endTime)}
                {hours && <span className="ml-2 text-zinc-400">（共 {hours} 小時）</span>}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  shootType === "dynamic" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {shootType === "dynamic" ? "動態拍攝" : "平面拍攝"}
                </span>
                {pricePerHour > 0 && hours && (
                  <span className="text-sm font-medium text-emerald-600">
                    NT$ {(parseInt(hours) * pricePerHour).toLocaleString()}（預約後匯款）
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/book/slots?date=${dateStr}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              更改時段
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">填寫預約資料</h2>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              placeholder="請輸入您的姓名"
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.customerName && (
              <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              電子信箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => updateField("customerEmail", e.target.value)}
              placeholder="example@email.com"
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.customerEmail && (
              <p className="text-xs text-red-500 mt-1">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              手機號碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => updateField("customerPhone", e.target.value)}
              placeholder="0912-345-678"
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.customerPhone && (
              <p className="text-xs text-red-500 mt-1">{errors.customerPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              使用人數
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  updateField("numberOfPeople", Math.max(1, form.numberOfPeople - 1))
                }
                className="w-9 h-9 rounded-lg border border-zinc-300 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                -
              </button>
              <span className="text-base font-medium w-8 text-center">
                {form.numberOfPeople}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateField("numberOfPeople", Math.min(20, form.numberOfPeople + 1))
                }
                className="w-9 h-9 rounded-lg border border-zinc-300 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-zinc-400">人</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              轉帳末五碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.lastFiveDigits}
              onChange={(e) => updateField("lastFiveDigits", e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="請輸入轉帳帳號末五碼"
              maxLength={5}
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.lastFiveDigits && (
              <p className="text-xs text-red-500 mt-1">{errors.lastFiveDigits}</p>
            )}
            <p className="text-xs text-zinc-400 mt-1">請先完成匯款，再填入帳號末五碼以完成預約</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              備註
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="如有特殊需求請在此說明..."
              rows={3}
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/book/slots?date=${dateStr}`}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              ← 上一步
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-medium text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "預約中..." : "確認預約"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
