export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-[var(--primary)]">Admin</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-[var(--border)] bg-white p-4">
          <nav className="grid gap-2 text-sm font-medium">
            <a href="#">User & Role Management</a>
            <a href="#">SAP S4 HANA Configuration</a>
            <a href="#">Audit Logs</a>
          </nav>
        </aside>
        <section className="rounded-lg border border-[var(--border)] bg-white p-6">
          <h2 className="text-xl font-semibold">Admin workspace</h2>
          <p className="mt-2 text-[var(--muted)]">
            Admin pages will follow the Finance Concierge side-menu layout.
          </p>
        </section>
      </div>
    </main>
  );
}

