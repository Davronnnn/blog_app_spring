export function Footer() {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-display italic">
          Marginalia — notes written in the margins.
        </p>
        <p className="text-faint">
          {new Date().getFullYear()} · Written with care.
        </p>
      </div>
    </footer>
  );
}
