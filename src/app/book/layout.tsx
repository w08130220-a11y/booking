export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <h1 className="text-xl font-bold text-zinc-900">PhotoCheck Studio</h1>
          <p className="text-sm text-zinc-500 mt-0.5">場地租借預約</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
