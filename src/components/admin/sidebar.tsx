"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "儀表板", icon: "📊" },
  { href: "/admin/bookings", label: "預約管理", icon: "📋" },
  { href: "/admin/revenue", label: "營收報表", icon: "💰" },
  { href: "/admin/schedule", label: "時段設定", icon: "⏰" },
  { href: "/admin/holidays", label: "休假日", icon: "📅" },
  { href: "/admin/settings", label: "價格設定", icon: "⚙️" },
];

export function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-zinc-200 rounded-lg flex items-center justify-center shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-zinc-200 z-40 flex flex-col transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-zinc-200">
          <h2 className="font-bold text-zinc-900">Bubu Studio</h2>
          <p className="text-xs text-zinc-500 mt-0.5">管理後台</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 font-medium"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-200">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-zinc-600">{username}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
