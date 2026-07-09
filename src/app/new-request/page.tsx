export default function NewRequestPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[var(--primary)]">
          Category Selection
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Please choose your request type before proceeding with the form.
        </p>
        <label className="mt-6 block text-sm font-medium" htmlFor="category">
          Category
        </label>
        <select
          className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2"
          id="category"
        >
          <option>Find items</option>
          <option>SAP S4 HANA Request</option>
          <option>Digital Support Request</option>
          <option>Application Enhancement Request</option>
          <option>Offboarding Request</option>
        </select>
        <button className="mt-6 rounded-md bg-[var(--primary)] px-5 py-2 font-semibold text-white">
          Next Step
        </button>
      </section>
    </main>
  );
}

