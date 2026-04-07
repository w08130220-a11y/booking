"use client";

const steps = [
  { label: "選擇日期", step: 1 },
  { label: "選擇時段", step: 2 },
  { label: "填寫資料", step: 3 },
  { label: "預約完成", step: 4 },
];

export function BookingStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map(({ label, step }, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step < current
                  ? "bg-zinc-900 text-white"
                  : step === current
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {step < current ? "✓" : step}
            </div>
            <span
              className={`text-xs mt-1.5 ${
                step <= current ? "text-zinc-900 font-medium" : "text-zinc-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px flex-1 mx-2 -mt-5 ${
                step < current ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
