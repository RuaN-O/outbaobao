type AdminShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AdminShell({ title, children }: AdminShellProps) {
  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>{title}</h1>
      </header>
      {children}
    </main>
  );
}
