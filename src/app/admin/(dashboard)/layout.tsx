import { redirect } from "next/navigation";
import { getAuthFromCookie } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthFromCookie();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex">
      <AdminSidebar username={admin.username} />
      <main className="flex-1 p-6 lg:p-8 lg:ml-64">{children}</main>
    </div>
  );
}
